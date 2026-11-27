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

  static let scheme = "rnv-cache"
  static let sizeLimit: Int64 = 100 * 1024 * 1024

  private let directory: URL
  private let lock = NSLock()
  // Files a loader is writing or reading right now; trimming leaves them alone.
  private var keysInUse: [String: Int] = [:]
  private static var loaderKey: UInt8 = 0

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
    let fileExtension = url.pathExtension.isEmpty ? "mp4" : url.pathExtension.lowercased()
    let completeFile = directory.appendingPathComponent("\(key).\(fileExtension)")

    if FileManager.default.fileExists(atPath: completeFile.path) {
      // The modification date is the "last used" date for trimming.
      try? FileManager.default.setAttributes(
        [.modificationDate: Date()], ofItemAtPath: completeFile.path)
      return AVURLAsset(url: completeFile)
    }

    guard
      var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let loader = CachingResourceLoader(
        url: url,
        headers: headers ?? [:],
        key: key,
        partialFile: directory.appendingPathComponent("\(key).partial"),
        indexFile: directory.appendingPathComponent("\(key).index"),
        completeFile: completeFile,
        cache: self
      )
    else {
      return headers.map { AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": $0]) }
        ?? AVURLAsset(url: url)
    }

    // AVFoundation calls a resource loader only for a scheme it cannot load itself.
    components.scheme = Self.scheme
    let asset = AVURLAsset(url: components.url ?? url)
    asset.resourceLoader.setDelegate(loader, queue: loader.queue)
    // The resource loader keeps its delegate weakly; the asset owns it.
    objc_setAssociatedObject(asset, &Self.loaderKey, loader, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    return asset
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

  /// Deletes the least recently used files until the cache fits in `sizeLimit`.
  fileprivate func trim() {
    lock.lock()
    let inUse = Set(keysInUse.keys)
    lock.unlock()

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

/// Answers one asset's loading requests from the cached part of the file and from the network.
/// Everything runs on `queue`.
private final class CachingResourceLoader: NSObject, AVAssetResourceLoaderDelegate,
  URLSessionDataDelegate
{
  let queue = DispatchQueue(label: "com.twg.video.cache", qos: .userInitiated)

  private struct Index: Codable {
    var contentLength: Int64?
    var contentType: String?
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
  private lazy var session: URLSession = {
    let operationQueue = OperationQueue()
    operationQueue.underlyingQueue = queue
    operationQueue.maxConcurrentOperationCount = 1
    return URLSession(configuration: .ephemeral, delegate: self, delegateQueue: operationQueue)
  }()

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
    }
    guard let handle = try? FileHandle(forUpdating: partialFile) else { return nil }
    fileHandle = handle

    super.init()
    cache.retain(key: key)
  }

  deinit {
    session.invalidateAndCancel()
    try? fileHandle.close()
    cache.release(key: key)
  }

  // MARK: - AVAssetResourceLoaderDelegate

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
  ) -> Bool {
    guard let dataRequest = loadingRequest.dataRequest else { return false }

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
    headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
    request.setValue(
      end.map { "bytes=\(start)-\($0 - 1)" } ?? "bytes=\(start)-", forHTTPHeaderField: "Range")
    request.cachePolicy = .reloadIgnoringLocalCacheData

    let task = session.dataTask(with: request)
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
    information.isByteRangeAccessSupported = true
    information.contentType = index.contentType
  }

  // MARK: - URLSessionDataDelegate

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

    if http.statusCode == 200 {
      // The server ignored the range and sends the whole file from the first byte.
      job.taskOffset = 0
      if http.expectedContentLength > 0 { index.contentLength = http.expectedContentLength }
    } else if let total = http.value(forHTTPHeaderField: "Content-Range")?
      .split(separator: "/").last.flatMap({ Int64($0) })
    {
      index.contentLength = total
    }
    if index.contentType == nil {
      index.contentType =
        http.mimeType.flatMap { UTType(mimeType: $0)?.identifier }
        ?? UTType(filenameExtension: url.pathExtension)?.identifier
        ?? AVFileType.mp4.rawValue
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

  private func saveIndex() {
    guard !isComplete, let data = try? JSONEncoder().encode(index) else { return }
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
    cache.trim()
  }
}
