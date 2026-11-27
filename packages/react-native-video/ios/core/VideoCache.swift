//
//  VideoCache.swift
//  ReactNativeVideo
//

import AVFoundation
import CryptoKit
import Foundation
import UniformTypeIdentifiers

/// Disk cache for progressive files (`shouldCache`).
///
/// A file that is fully on disk is played from there. Otherwise the asset gets a resource
/// loader that answers the player's byte-range requests from the network, keeps every byte
/// it passes on, and turns the result into a cached file once the whole file has arrived.
/// The cache lives in the app's caches directory and evicts the least recently used files
/// above `sizeLimit`.
final class VideoCache {
  static let shared = VideoCache()

  // "rnv-cache-http" / "rnv-cache-https": the uri's own scheme stays readable.
  static let schemePrefix = "rnv-cache-"
  static let sizeLimit: Int64 = 100 * 1024 * 1024
  private static let lastUsedGranularity: TimeInterval = 3600

  private let directory: URL
  private let lock = NSRecursiveLock()
  // One loader per file, shared by every asset of that uri: two loaders would write the same
  // partial file with two different ideas of what is in it.
  private var loaders: [String: WeakLoader] = [:]
  // Files a loader is writing or reading right now; trimming leaves them alone.
  private var keysInUse: [String: Int] = [:]
  private let trimQueue = DispatchQueue(label: "com.twg.video.cache.trim", qos: .utility)
  private static var loaderKey: UInt8 = 0
  private static var useKey: UInt8 = 0

  private init() {
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    directory = caches.appendingPathComponent("RNVCache", isDirectory: true)
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  /// Only progressive files loaded over the network are cached. A cached HLS playlist would be
  /// served stale, which breaks live streams. DRM and external subtitles use their own loaders.
  ///
  /// `declaredType` is the stream type the app gave for a uri that does not show it; it wins
  /// over the uri's extension.
  static func canCache(url: URL, config: NativeVideoConfig, declaredType: String? = nil) -> Bool {
    guard config.shouldCache == true else { return false }
    guard let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return false
    }
    guard config.drm == nil, config.externalSubtitles?.isEmpty != false else { return false }
    let declared = declaredType?.trimmingCharacters(in: CharacterSet(charactersIn: ". ")) ?? ""
    let fileExtension = (declared.isEmpty ? url.pathExtension : declared).lowercased()
    return fileExtension != "m3u8" && fileExtension != "mpd"
  }

  func asset(for url: URL, headers: [String: String]?) -> AVURLAsset {
    let key = Self.key(for: url)
    // The cached file is played by its name, so a uri without a media extension (".php",
    // none) is stored as MP4.
    let pathExtension = url.pathExtension.lowercased()
    let isMedia = UTType(filenameExtension: pathExtension)?.conforms(to: .audiovisualContent) == true
    let fileExtension = isMedia ? pathExtension : "mp4"
    let completeFile = directory.appendingPathComponent("\(key).\(fileExtension)")

    lock.lock()
    defer { lock.unlock() }

    if FileManager.default.fileExists(atPath: completeFile.path) {
      // The modification date is the "last used" date for trimming. It is moved at most once
      // an hour: AVFoundation keeps a file it has played open, and after a change of the date
      // it opens the file again and keeps both, one more descriptor with every play.
      let attributes = try? FileManager.default.attributesOfItem(atPath: completeFile.path)
      let lastUsed = attributes?[.modificationDate] as? Date ?? .distantPast
      if Date().timeIntervalSince(lastUsed) > Self.lastUsedGranularity {
        try? FileManager.default.setAttributes(
          [.modificationDate: Date()], ofItemAtPath: completeFile.path)
      }
      let asset = AVURLAsset(url: completeFile)
      // Trimming leaves the file alone for as long as this asset lives.
      objc_setAssociatedObject(
        asset, &Self.useKey, KeyUse(cache: self, key: key), .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
      return asset
    }

    // The first asset's headers are used for the whole download.
    let shared =
      loaders[key]?.loader
      ?? CachingResourceLoader(
        url: url,
        headers: headers ?? [:],
        key: key,
        partialFile: directory.appendingPathComponent("\(key).partial"),
        indexFile: directory.appendingPathComponent("\(key).index"),
        completeFile: completeFile,
        cache: self
      )
    guard
      var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let loader = shared
    else {
      return headers.map { AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": $0]) }
        ?? AVURLAsset(url: url)
    }

    loaders[key] = WeakLoader(loader: loader)
    // Partial files count too: a feed of videos that are never watched to the end must not
    // grow without limit.
    trimSoon()

    // AVFoundation calls a resource loader only for a scheme it cannot load itself.
    components.scheme = Self.schemePrefix + (url.scheme?.lowercased() ?? "https")
    let asset = AVURLAsset(url: components.url ?? url)
    asset.resourceLoader.setDelegate(loader, queue: loader.queue)
    // The resource loader keeps its delegate weakly; the asset owns it.
    objc_setAssociatedObject(asset, &Self.loaderKey, loader, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    return asset
  }

  /// The uri the app gave for an asset that goes through the cache; other urls are returned
  /// as they are.
  static func originalURL(for url: URL) -> URL {
    guard let scheme = url.scheme, scheme.hasPrefix(schemePrefix),
      var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
    else { return url }
    components.scheme = String(scheme.dropFirst(schemePrefix.count))
    return components.url ?? url
  }

  private static func key(for url: URL) -> String {
    SHA256.hash(data: Data(url.absoluteString.utf8)).map { String(format: "%02x", $0) }.joined()
  }

  fileprivate func retain(key: String) {
    lock.lock()
    keysInUse[key, default: 0] += 1
    lock.unlock()
  }

  fileprivate func release(key: String) {
    lock.lock()
    if let count = keysInUse[key], count > 1 {
      keysInUse[key] = count - 1
    } else {
      keysInUse[key] = nil
    }
    lock.unlock()
  }

  fileprivate func trimSoon() {
    trimQueue.async { [weak self] in self?.trim() }
  }

  /// Deletes the least recently used files until the cache fits in `sizeLimit`. Holds the lock,
  /// so that no asset is created for a file while it is being deleted.
  private func trim() {
    lock.lock()
    defer { lock.unlock() }
    let inUse = Set(keysInUse.keys)

    let keys: [URLResourceKey] = [.fileSizeKey, .contentModificationDateKey]
    guard
      let files = try? FileManager.default.contentsOfDirectory(
        at: directory, includingPropertiesForKeys: keys)
    else { return }

    var entries: [(url: URL, size: Int64, date: Date)] = files.compactMap { file in
      guard let values = try? file.resourceValues(forKeys: Set(keys)) else { return nil }
      return (file, Int64(values.fileSize ?? 0), values.contentModificationDate ?? .distantPast)
    }
    var total = entries.reduce(0) { $0 + $1.size }
    entries.sort { $0.date < $1.date }

    for entry in entries where total > Self.sizeLimit {
      let key = entry.url.deletingPathExtension().lastPathComponent
      if inUse.contains(key) { continue }
      if (try? FileManager.default.removeItem(at: entry.url)) != nil {
        total -= entry.size
      }
    }
  }
}

private struct WeakLoader {
  weak var loader: CachingResourceLoader?
}

/// Answers the loading requests for one file (from every asset of its uri) from the cached part
/// of the file and from the network. Everything runs on `queue`.
private final class CachingResourceLoader: NSObject, AVAssetResourceLoaderDelegate {
  let queue = DispatchQueue(label: "com.twg.video.cache", qos: .userInitiated)

  private struct Index: Codable {
    var contentLength: Int64?
    var contentType: String?
    // ETag or Last-Modified of the file the cached bytes came from.
    var validator: String?
    // false once the server answered a range request with the whole file.
    var acceptsRanges: Bool?
    // Half-open byte ranges [start, end) that are on disk, sorted and merged.
    var ranges: [[Int64]] = []
  }

  private final class Job {
    let request: AVAssetResourceLoadingRequest
    var position: Int64
    let end: Int64?  // nil: to the end of the file
    var task: URLSessionDataTask?
    var taskOffset: Int64 = 0
    // What the running task was asked for; nil end means "to the end of the file".
    var fetchStart: Int64 = 0
    var fetchEnd: Int64?
    // Waiting for bytes that another job's task is already downloading.
    var isWaiting = false
    // The next slice of cached bytes is queued behind whatever the player sent meanwhile.
    var isScheduled = false

    init(request: AVAssetResourceLoadingRequest, position: Int64, end: Int64?) {
      self.request = request
      self.position = position
      self.end = end
    }
  }

  private static let chunkSize = 256 * 1024
  // Cached bytes answered in one go before the queue gets to run other work (a cancel).
  private static let chunksPerSlice = 4
  private static let waitWindow: Int64 = 1024 * 1024
  // The index is written after this many new bytes, so that an app that is killed in the
  // middle of a long download keeps most of it.
  private static let saveInterval = 2 * 1024 * 1024

  private let url: URL
  private let headers: [String: String]
  private let key: String
  private let partialFile: URL
  private let indexFile: URL
  private let completeFile: URL
  private unowned let cache: VideoCache
  private let fileHandle: FileHandle
  private var index: Index
  private var jobs: [Job] = []
  private var isComplete = false
  private var unsavedBytes = 0
  // The uri turned out to be an HLS or DASH manifest: every request goes to the network as
  // if there were no cache.
  private var isStream = false
  // Created with the first network request. A session keeps its delegate alive until it is
  // invalidated, so the delegate is a proxy that holds this loader weakly: the loader goes
  // away with its asset and invalidates the session then.
  private var session: URLSession?

  private func networkSession() -> URLSession {
    if let session { return session }
    let operationQueue = OperationQueue()
    operationQueue.underlyingQueue = queue
    operationQueue.maxConcurrentOperationCount = 1
    // The default configuration sends the app's cookies, as AVURLAsset does without the cache.
    let configuration = URLSessionConfiguration.default
    configuration.urlCache = nil
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    let created = URLSession(
      configuration: configuration, delegate: SessionDelegate(loader: self),
      delegateQueue: operationQueue)
    session = created
    return created
  }

  init?(
    url: URL, headers: [String: String], key: String, partialFile: URL, indexFile: URL,
    completeFile: URL, cache: VideoCache
  ) {
    self.url = url
    self.headers = headers
    self.key = key
    self.partialFile = partialFile
    self.indexFile = indexFile
    self.completeFile = completeFile
    self.cache = cache

    let fileManager = FileManager.default
    // A partial file without its index (or the other way round) cannot be trusted.
    let stored = (try? Data(contentsOf: indexFile)).flatMap {
      try? JSONDecoder().decode(Index.self, from: $0)
    }
    if stored == nil || !fileManager.fileExists(atPath: partialFile.path) {
      try? fileManager.removeItem(at: partialFile)
      try? fileManager.removeItem(at: indexFile)
      guard fileManager.createFile(atPath: partialFile.path, contents: nil) else { return nil }
      index = Index()
    } else {
      index = stored ?? Index()
      // An index that claims more than the file holds would serve bytes that are not there.
      let size = (try? fileManager.attributesOfItem(atPath: partialFile.path)[.size] as? Int64) ?? 0
      if let lastByte = index.ranges.map({ $0[1] }).max(), lastByte > size {
        index.ranges = []
      }
    }
    guard let handle = try? FileHandle(forUpdating: partialFile) else { return nil }
    fileHandle = handle

    super.init()
    cache.retain(key: key)
  }

  deinit {
    session?.invalidateAndCancel()
    try? fileHandle.close()
    cache.release(key: key)
  }

  // MARK: - AVAssetResourceLoaderDelegate

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
  ) -> Bool {
    guard let dataRequest = loadingRequest.dataRequest else { return false }

    // Only the file itself is cached. Anything else the player resolves against the private
    // scheme (the playlists and segments of a stream) is loaded the usual way.
    let requested = loadingRequest.request.url.map { VideoCache.originalURL(for: $0) }
    if isStream || (requested != nil && requested?.absoluteString != url.absoluteString) {
      redirect(loadingRequest, to: requested ?? url)
      return true
    }

    let start = dataRequest.currentOffset != 0 ? dataRequest.currentOffset : dataRequest.requestedOffset
    let end: Int64? =
      dataRequest.requestsAllDataToEndOfResource
      ? nil : dataRequest.requestedOffset + Int64(dataRequest.requestedLength)
    let job = Job(request: loadingRequest, position: start, end: end)
    jobs.append(job)
    advance(job)
    return true
  }

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    didCancel loadingRequest: AVAssetResourceLoadingRequest
  ) {
    guard let job = jobs.first(where: { $0.request === loadingRequest }) else { return }
    finish(job, error: nil, respond: false)
  }

  private func redirect(_ request: AVAssetResourceLoadingRequest, to target: URL) {
    var redirect = URLRequest(url: target)
    headers.forEach { redirect.setValue($1, forHTTPHeaderField: $0) }
    request.redirect = redirect
    request.response = HTTPURLResponse(
      url: target, statusCode: 302, httpVersion: nil, headerFields: nil)
    request.finishLoading()
  }

  // MARK: - Serving a request

  /// Moves a job forward: bytes that are on disk are answered from there, the first missing
  /// stretch is fetched from the network.
  private func advance(_ job: Job) {
    guard jobs.contains(where: { $0 === job }), job.task == nil, !job.isScheduled else { return }

    var chunksLeft = Self.chunksPerSlice
    while true {
      // The player drops most of its requests after a few bytes (and all of them on a seek).
      // Its cancel arrives on this queue, so a long cached stretch is answered in slices:
      // otherwise megabytes go to a request nobody reads, and the hole behind them is
      // fetched from the network for nothing.
      if job.request.isCancelled {
        finish(job, error: nil, respond: false)
        return
      }
      if chunksLeft == 0 {
        job.isScheduled = true
        queue.async { [weak self] in
          job.isScheduled = false
          self?.advance(job)
        }
        return
      }

      if let contentLength = index.contentLength {
        fillContentInformation(job.request, contentLength: contentLength)
      }
      let end = job.end ?? index.contentLength
      if let end, job.position >= end {
        finish(job, error: nil)
        return
      }

      guard let cached = cachedRange(containing: job.position) else {
        // The player often asks for overlapping ranges at once. If another request is already
        // downloading this stretch, wait for its bytes instead of downloading them twice.
        if isBeingFetched(job.position, by: job) {
          job.isWaiting = true
          return
        }
        // Unknown length or a hole at this position: ask the server from here to the next
        // cached byte (or to the end of what the player asked for).
        let nextCachedStart = index.ranges.map { $0[0] }.filter { $0 > job.position }.min()
        let fetchEnd = [end, nextCachedStart].compactMap { $0 }.min()
        fetch(job, from: job.position, to: fetchEnd)
        return
      }

      let upperBound = min(cached[1], end ?? cached[1])
      let count = Int(min(Int64(Self.chunkSize), upperBound - job.position))
      do {
        try fileHandle.seek(toOffset: UInt64(job.position))
        guard let data = try fileHandle.read(upToCount: count), !data.isEmpty else {
          throw CocoaError(.fileReadCorruptFile)
        }
        job.request.dataRequest?.respond(with: data)
        job.position += Int64(data.count)
        chunksLeft -= 1
      } catch {
        finish(job, error: error)
        return
      }
    }
  }

  private func isBeingFetched(_ position: Int64, by job: Job) -> Bool {
    jobs.contains { other in
      // Only when that download is about to reach the position: a request for the end of
      // the file (the index of many MP4 files) must not wait for the whole file.
      other !== job && other.task != nil && position >= other.taskOffset
        && position - other.taskOffset <= Self.waitWindow
        && (other.fetchEnd.map { position < $0 } ?? true)
    }
  }

  /// Lets the jobs that wait for another job's download move on.
  private func advanceWaitingJobs() {
    for job in jobs where job.isWaiting {
      job.isWaiting = false
      advance(job)
    }
  }

  private func fetch(_ job: Job, from start: Int64, to end: Int64?) {
    var request = URLRequest(url: url)
    // A compressed answer would be written at offsets that count the compressed bytes.
    request.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
    headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
    request.setValue(
      end.map { "bytes=\(start)-\($0 - 1)" } ?? "bytes=\(start)-", forHTTPHeaderField: "Range")
    request.cachePolicy = .reloadIgnoringLocalCacheData

    let task = networkSession().dataTask(with: request)
    job.task = task
    job.taskOffset = start
    job.fetchStart = start
    job.fetchEnd = end
    task.resume()
  }

  private func finish(_ job: Job, error: Error?, respond: Bool = true) {
    jobs.removeAll { $0 === job }
    job.task?.cancel()
    job.task = nil
    completeFileIfWhole()
    saveIndex()
    if respond, !job.request.isFinished, !job.request.isCancelled {
      if let error {
        job.request.finishLoading(with: error)
      } else {
        job.request.finishLoading()
      }
    }
    // A job that waited for this one's download has to fetch for itself now.
    advanceWaitingJobs()
  }

  private func fillContentInformation(_ request: AVAssetResourceLoadingRequest, contentLength: Int64) {
    guard let information = request.contentInformationRequest else { return }
    information.contentLength = contentLength
    information.isByteRangeAccessSupported = index.acceptsRanges ?? true
    information.contentType = index.contentType
  }

  // MARK: - Network answers (forwarded by SessionDelegate)

  func urlSession(
    _ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let job = jobs.first(where: { $0.task === dataTask }),
      let http = response as? HTTPURLResponse
    else {
      completionHandler(.cancel)
      return
    }
    guard http.statusCode == 206 || http.statusCode == 200 else {
      completionHandler(.cancel)
      job.task = nil
      finish(job, error: URLError(.badServerResponse))
      return
    }

    let mimeType = http.mimeType?.lowercased() ?? ""
    if mimeType.contains("mpegurl") || mimeType.contains("dash+xml") {
      // A manifest behind a uri without an extension. A cached manifest would be served
      // stale, and its segments are other files: hand the whole source back to the player.
      completionHandler(.cancel)
      isStream = true
      for other in jobs {
        other.task?.cancel()
        other.task = nil
        if !other.request.isFinished, !other.request.isCancelled { redirect(other.request, to: url) }
      }
      jobs.removeAll()
      // Nothing of a stream is kept, not even an empty file.
      index = Index()
      try? FileManager.default.removeItem(at: partialFile)
      try? FileManager.default.removeItem(at: indexFile)
      return
    }

    // The file changed on the server since part of it was cached: the cached part is
    // worthless, and requests that already got bytes of the old file cannot be continued.
    let validator =
      http.value(forHTTPHeaderField: "ETag") ?? http.value(forHTTPHeaderField: "Last-Modified")
    if let validator, let known = index.validator, known != validator {
      completionHandler(.cancel)
      discardCachedBytes()
      for other in jobs { finish(other, error: URLError(.resourceUnavailable)) }
      return
    }
    if let validator { index.validator = validator }

    if http.statusCode == 200 {
      // The server ignored the range and sends the whole file from the first byte.
      job.taskOffset = 0
      index.acceptsRanges = false
      if http.expectedContentLength > 0 { index.contentLength = http.expectedContentLength }
    } else {
      // "bytes 100-199/1000"
      let contentRange = http.value(forHTTPHeaderField: "Content-Range") ?? ""
      let parts = contentRange.split(whereSeparator: { " -/".contains($0) })
      if parts.count >= 2, let start = Int64(parts[1]), start != job.fetchStart {
        // Bytes for another offset would be written in the wrong place.
        completionHandler(.cancel)
        job.task = nil
        finish(job, error: URLError(.badServerResponse))
        return
      }
      if let total = parts.last.flatMap({ Int64($0) }) { index.contentLength = total }
    }
    if index.contentType == nil {
      index.contentType = Self.contentType(mimeType: http.mimeType, url: url)
    }
    if let contentLength = index.contentLength {
      fillContentInformation(job.request, contentLength: contentLength)
    }
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    guard let job = jobs.first(where: { $0.task === dataTask }) else { return }
    let offset = job.taskOffset
    job.taskOffset += Int64(data.count)

    do {
      try fileHandle.seek(toOffset: UInt64(offset))
      try fileHandle.write(contentsOf: data)
      addRange(offset, offset + Int64(data.count))
      completeFileIfWhole()
      unsavedBytes += data.count
      if unsavedBytes >= Self.saveInterval {
        unsavedBytes = 0
        saveIndex()
      }
    } catch {
      // The disk is full or the file is gone: keep playing, stop caching this stretch.
    }

    // With a 200 answer the body starts at byte 0, before what the player asked for.
    let skip = Int(max(0, job.position - offset))
    guard skip < data.count else {
      advanceWaitingJobs()
      return
    }
    var chunk = data.subdata(in: (data.startIndex + skip)..<data.endIndex)
    if let end = job.end, job.position + Int64(chunk.count) > end {
      chunk = chunk.prefix(Int(end - job.position))
    }
    if !chunk.isEmpty {
      job.request.dataRequest?.respond(with: chunk)
      job.position += Int64(chunk.count)
    }
    // The download ran into bytes that are already on disk (fetched by an earlier request for
    // the end of the file): stop it and serve the rest from disk.
    if job.position == job.taskOffset, cachedRange(containing: job.taskOffset) != nil {
      dataTask.cancel()
      job.task = nil
      advance(job)
    }
    advanceWaitingJobs()
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let job = jobs.first(where: { $0.task === task }) else { return }
    job.task = nil
    completeFileIfWhole()
    if let error {
      finish(job, error: error)
    } else {
      saveIndex()
      advance(job)
      advanceWaitingJobs()
    }
  }

  /// The type AVFoundation is told. Storage servers often send "application/octet-stream",
  /// which it cannot open, so a type that is not audio or video falls back to the uri's
  /// extension and then to MP4.
  private static func contentType(mimeType: String?, url: URL) -> String {
    let candidates = [
      mimeType.flatMap { UTType(mimeType: $0) },
      UTType(filenameExtension: url.pathExtension),
    ]
    for case let type? in candidates where type.conforms(to: .audiovisualContent) {
      return type.identifier
    }
    return AVFileType.mp4.rawValue
  }

  // MARK: - What is on disk

  private func cachedRange(containing position: Int64) -> [Int64]? {
    index.ranges.first { $0[0] <= position && position < $0[1] }
  }

  private func addRange(_ start: Int64, _ end: Int64) {
    var merged: [[Int64]] = []
    for range in (index.ranges + [[start, end]]).sorted(by: { $0[0] < $1[0] }) {
      if let last = merged.last, range[0] <= last[1] {
        merged[merged.count - 1][1] = max(last[1], range[1])
      } else {
        merged.append(range)
      }
    }
    index.ranges = merged
  }

  private func discardCachedBytes() {
    index = Index()
    try? fileHandle.truncate(atOffset: 0)
    saveIndex()
  }

  private func saveIndex() {
    guard !isComplete, !isStream, let data = try? JSONEncoder().encode(index) else { return }
    try? data.write(to: indexFile, options: .atomic)
  }

  /// Once every byte is on disk the partial file becomes the cached file. The open file handle
  /// follows the rename, so this loader keeps serving its asset from it.
  private func completeFileIfWhole() {
    guard !isComplete, let contentLength = index.contentLength, contentLength > 0,
      index.ranges.count == 1, index.ranges[0][0] == 0, index.ranges[0][1] >= contentLength
    else { return }

    try? fileHandle.synchronize()
    try? FileManager.default.removeItem(at: completeFile)
    guard (try? FileManager.default.moveItem(at: partialFile, to: completeFile)) != nil else { return }
    isComplete = true
    try? FileManager.default.removeItem(at: indexFile)
    cache.trimSoon()
  }
}

/// Marks a cached file as in use for as long as the object lives.
private final class KeyUse {
  private unowned let cache: VideoCache
  private let key: String

  init(cache: VideoCache, key: String) {
    self.cache = cache
    self.key = key
    cache.retain(key: key)
  }

  deinit {
    cache.release(key: key)
  }
}

/// The session's delegate. It forwards to the loader without keeping it alive.
private final class SessionDelegate: NSObject, URLSessionDataDelegate {
  private weak var loader: CachingResourceLoader?

  init(loader: CachingResourceLoader) {
    self.loader = loader
  }

  func urlSession(
    _ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let loader else {
      completionHandler(.cancel)
      return
    }
    loader.urlSession(
      session, dataTask: dataTask, didReceive: response, completionHandler: completionHandler)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    loader?.urlSession(session, dataTask: dataTask, didReceive: data)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    loader?.urlSession(session, task: task, didCompleteWithError: error)
  }
}
