//
//  HybridVideoPlayer.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import AVFoundation
import Foundation
import NitroModules

class HybridVideoPlayer: HybridVideoPlayerSpec, NativeVideoPlayerSpec {

  /**
   * Player instance for video playback
   */
  var player: AVPlayer {
    didSet {
      playerObserver?.initializePlayerObservers()
    }
    willSet {
      playerObserver?.invalidatePlayerObservers()
    }
  }

  var playerObserver: VideoPlayerObserver?
  private let sourceLoader = SourceLoader()
  private var storedSource: any HybridVideoPlayerSourceSpec
  private var storedPlayerItem: AVPlayerItem?
  private var storedStatus: VideoPlayerStatus = .idle

  private struct LoadContext {
    let source: any HybridVideoPlayerSourceSpec
    let token: SourceLoader.Token
  }

  private struct LoadedPlayerItem {
    let item: AVPlayerItem
    let context: LoadContext
  }

  // The helpers below run on the JS thread. They only touch state that `sourceLoader`
  // guards with its lock, so they must not wait for the main thread: it is busy installing
  // the previous item exactly when JS creates or re-sources a player (#4820). Everything
  // that needs the main thread (`commitPlayerItem`, `releaseOnMainThread`) is dispatched.
  private func beginLoad() throws -> LoadContext {
    var source: (any HybridVideoPlayerSourceSpec)?
    guard let token = try sourceLoader.begin(onBegin: {
      source = storedSource
    }), let source else { throw CancellationError() }
    return LoadContext(source: source, token: token)
  }

  private func beginLoadIfPlayerItemMissing() throws -> LoadContext? {
    var source: (any HybridVideoPlayerSourceSpec)?
    guard let token = try sourceLoader.begin(
      if: { storedPlayerItem == nil },
      onBegin: { source = storedSource }
    ) else { return nil }
    guard let source else { throw CancellationError() }
    return LoadContext(source: source, token: token)
  }

  private func beginPreloadIfNeeded() throws -> LoadContext? {
    var source: (any HybridVideoPlayerSourceSpec)?
    guard let token = try sourceLoader.begin(
      if: { storedStatus == .idle },
      onBegin: { source = storedSource }
    ) else { return nil }
    guard let source else { throw CancellationError() }
    return LoadContext(source: source, token: token)
  }

  private func replaceSourceAndBeginLoad(
    with newSource: any HybridVideoPlayerSourceSpec
  ) throws -> LoadContext {
    var previousSource: (any HybridVideoPlayerSourceSpec)?
    guard let token = try sourceLoader.begin(onBegin: {
      previousSource = storedSource
      storedSource = newSource
    }), let previousSource else { throw CancellationError() }
    let context = LoadContext(source: newSource, token: token)
    releaseAssetIfNotUsedByCurrentLoad(for: previousSource)
    // The next onAudioTrackChange describes the new source. Without this, a source with the
    // same audio tracks (the next episode, say) has the same signature and gets no event.
    // The signature belongs to the main thread (emitAudioTrackChange); this runs there before
    // the new item is committed, which is queued later.
    DispatchQueue.main.async { [weak self] in
      self?.lastEmittedAudioTrackSignature = nil
    }
    return context
  }

  private func ensureCurrentLoad(_ context: LoadContext) throws {
    guard sourceLoader.isCurrent(context.token) else { throw CancellationError() }
  }

  private func releaseAssetIfNotUsedByCurrentLoad(
    for source: any HybridVideoPlayerSourceSpec
  ) {
    let currentSource = sourceLoader.withState { storedSource }
    guard ObjectIdentifier(currentSource as AnyObject) != ObjectIdentifier(source as AnyObject) else { return }
    releaseAsset(for: source)
  }

  private func releaseAsset(for source: any HybridVideoPlayerSourceSpec) {
    (source as? HybridVideoPlayerSource)?.releaseAsset()
  }

  private func close() -> (any HybridVideoPlayerSourceSpec)? {
    sourceLoader.close(update: { storedSource })
  }

  init(source: (any HybridVideoPlayerSourceSpec)) throws {
    storedSource = source
    self.eventEmitter = HybridVideoPlayerEventEmitter()

    // Initialize AVPlayer with empty item
    self.player = AVPlayer()

    super.init()
    self.playerObserver = VideoPlayerObserver(delegate: self)
    self.playerObserver?.initializePlayerObservers()

    if source.config.initializeOnCreation == true {
      let initialLoadContext = try beginLoad()
      Task {
        do {
          let loadedPlayerItem = try await self.loadPlayerItem(for: initialLoadContext)
          try await self.commitPlayerItem(loadedPlayerItem)
        } catch {
          // Ignore cancellation errors during initialization
        }
      }
    }

    VideoManager.shared.register(player: self)
  }

  deinit {
    guard let releasedSource = close() else { return }
    try? _eventEmitter?.clearAllListeners()
    releaseAsset(for: releasedSource)

    runOnMainThreadSync {
      releaseOnMainThread()
    }
  }

  // MARK: - Hybrid Impl

  var source: any HybridVideoPlayerSourceSpec {
    get { sourceLoader.withState { storedSource } }
    set {
      let releasedSource = sourceLoader.cancel {
        let releasedSource = storedSource
        storedSource = newValue
        return releasedSource
      }
      withExtendedLifetime(releasedSource) {}
    }
  }

  var playerItem: AVPlayerItem? {
    get { sourceLoader.withState { storedPlayerItem } }
    set {
      sourceLoader.withState { storedPlayerItem = newValue }
      if let bufferConfig = source.config.bufferConfig {
        newValue?.setBufferConfig(config: bufferConfig)
      }
    }
  }

  var status: VideoPlayerStatus {
    get { sourceLoader.withState { storedStatus } }
    set {
      let previous = sourceLoader.withState { () -> VideoPlayerStatus in
        let previous = storedStatus
        storedStatus = newValue
        return previous
      }
      if newValue != previous {
        _eventEmitter?.onStatusChange(newValue)
      }
    }
  }

  /// Reports an asynchronous failure of the current item (e.g. a 404): sets the error status
  /// and emits `onError` only on the transition into `.error`, so a failure seen by several
  /// observers is reported once. Load promises reject instead and never call this.
  func reportAsyncError(_ error: Error?) {
    let previous = sourceLoader.withState { () -> VideoPlayerStatus in
      let previous = storedStatus
      storedStatus = .error
      return previous
    }
    guard previous != .error else { return }
    _eventEmitter?.onStatusChange(.error)
    _eventEmitter?.onError(PlayerError.playbackFailed(error: error).getMessage())
  }

  var isReleased: Bool { sourceLoader.isClosed }

  var eventEmitter: HybridVideoPlayerEventEmitterSpec
  var _eventEmitter: HybridVideoPlayerEventEmitter? {
    return eventEmitter as? HybridVideoPlayerEventEmitter
  }

  var volume: Double {
    set {
      player.volume = Float(newValue)
    }
    get {
      return Double(player.volume)
    }
  }

  var muted: Bool {
    set {
      player.isMuted = newValue
      _eventEmitter?.onVolumeChange(
        onVolumeChangeData(
          volume: Double(player.volume),
          muted: muted
        )
      )
    }
    get {
      return player.isMuted
    }
  }

  var currentTime: Double {
    set {
      // Time is counted from `cropStart` when the source is cropped, and a seek past
      // `cropEnd` stops at `cropEnd`, as on Android.
      var target = max(0, newValue)
      if let item = player.currentItem, item.forwardPlaybackEndTime.isNumeric {
        let croppedDuration = item.croppedDuration
        if croppedDuration.isFinite {
          target = min(target, croppedDuration)
        }
      }
      _eventEmitter?.onSeek(target)
      let cropStart = player.currentItem?.cropStartSeconds ?? 0
      player.seek(
        to: CMTime(seconds: target + cropStart, preferredTimescale: 1000),
        toleranceBefore: .zero,
        toleranceAfter: .zero
      )
    }
    get {
      player.currentItem?.croppedCurrentTime ?? player.currentTime().seconds
    }
  }

  var duration: Double {
    player.currentItem?.croppedDuration ?? Double.nan
  }

  var rate: Double {
    set {
      if #available(iOS 16.0, tvOS 16.0, *) {
        player.defaultRate = Float(newValue)
      }

      player.rate = Float(newValue)
    }
    get {
      return Double(player.rate)
    }
  }

  var loop: Bool = false {
    didSet {
      // A player that stops at the end cannot be started again from the background
      player.actionAtItemEnd = loop ? .none : .pause
    }
  }

  var mixAudioMode: MixAudioMode = .auto {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var ignoreSilentSwitchMode: IgnoreSilentSwitchMode = .auto {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var playInBackground: Bool = false {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var playWhenInactive: Bool = false

  // iOS default: 500 ms, as before this option existed. Android uses 250 ms.
  var progressUpdateInterval: Double = VideoPlayerObserver.defaultProgressUpdateInterval {
    didSet {
      guard progressUpdateInterval.isFinite, progressUpdateInterval > 0 else {
        progressUpdateInterval = oldValue
        return
      }
      playerObserver?.progressUpdateInterval = progressUpdateInterval
    }
  }

  var disableAudioSessionManagement: Bool = false {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var allowsExternalPlayback: Bool {
    get {
      return player.allowsExternalPlayback
    }
    set {
      player.allowsExternalPlayback = newValue
    }
  }

  var audioOutput: AudioOutput = .speaker {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var wasAutoPaused: Bool = false

  var wasInterruptedWhilePlaying: Bool = false

  /// Whether the player was playing when backgrounded — used to resume it on
  /// return if the system paused background playback.
  var wasPlayingInBackground: Bool = false

  // Text track selection state
  private var selectedExternalTrackIndex: Int? = nil
  // The text track last reported by onTrackChange, nil for none.
  private var emittedTextTrackId: String? = nil

  // MARK: - Video track (quality) selection state
  //
  // Main-thread-only, like the ad gate state above. Quality selection is a pure
  // imperative call on the live player: nothing here touches `source` or
  // `bufferConfig`, so a quality pick can never make JS recreate the player.

  /// The id the user pinned through `selectVideoTrack`, or nil for automatic.
  /// Deliberately outlives the `AVPlayerItem` it was applied to - it is a
  /// request about the source, and every source replacement builds a new item.
  private var requestedVideoTrackId: String? {
    didSet { publishVideoTracks() }
  }

  /// The current source's rendition ladder, best first. Empty for non-HLS
  /// sources, and until the master playlist has been fetched.
  private var cachedVideoRenditions: [VideoRendition] = [] {
    didSet { publishVideoTracks() }
  }

  /// Which URL `cachedVideoRenditions` describes. Fetching the master playlist
  /// is a real extra HTTP request (AVPlayer fetches it too but exposes none of
  /// it), so it is done once per source.
  private var cachedVideoRenditionsURL: URL?
  /// The headers that fetch was made with, so replacing a source with the same
  /// URL but different headers (e.g. a refreshed token) fetches again.
  private var cachedVideoRenditionsHeaders: [String: String] = [:]
  private var videoRenditionLoadTask: Task<Void, Never>?

  /// The rendition actually on screen, nearest-matched from the access log.
  private var activeVideoTrackId: String?

  /// True while caps written by a pin are still on the item. Returning to Auto
  /// needs to know it has something to undo, by which point
  /// `requestedVideoTrackId` is already nil.
  private var hasPinnedVideoQuality = false

  private var videoQualityRecheckWorkItem: DispatchWorkItem?

  // MARK: - Audio track selection state
  //
  // Main-thread-only. Alternate audio renditions are a real AVFoundation media
  // selection group, exactly like text tracks, so a pick is an exact switch
  // rather than a hint to an ABR algorithm. There is nothing to approximate,
  // hence no requested/active split and no recheck timer.

  /// The id the user asked for through `selectAudioTrack`, or nil for
  /// automatic. Kept only because a call can legitimately arrive before the
  /// asset's media selection groups exist (nothing to select in yet), in which
  /// case it is replayed from the `.readyToPlay` hook.
  private var requestedAudioTrackId: String?

  /// Dedupe key for `onAudioTrackChange`. The emission points below fire more
  /// often than the track set actually changes.
  private var lastEmittedAudioTrackSignature: String?

  // MARK: - Published track state
  //
  // The track state above lives on the main thread, and JS reads it through getters. A
  // getter that hops to the main thread blocks the JS thread for as long as the main thread
  // is busy (#4820). So the main thread publishes a copy here whenever the state changes,
  // and the getters read the copy.

  private struct PublishedTracks {
    var videoRenditions: [VideoRendition] = []
    var selectedVideoTrackId: String?
    /// `selectVideoTrack` calls made from JS that the main thread has not applied yet.
    /// While there are any, `selectedVideoTrackId` is what JS asked for last.
    var pendingVideoSelections = 0

    var audioTracks: [AudioTrack] = []
    var selectedAudioTrackId: String?
    /// Same as `pendingVideoSelections`, for `selectAudioTrack`.
    var pendingAudioSelections = 0
  }

  private let publishedTracksLock = NSLock()
  private var publishedTracks = PublishedTracks()

  private func withPublishedTracks<T>(_ body: (inout PublishedTracks) -> T) -> T {
    publishedTracksLock.lock()
    defer { publishedTracksLock.unlock() }
    return body(&publishedTracks)
  }

  /// Main thread only.
  private func publishVideoTracks() {
    withPublishedTracks {
      $0.videoRenditions = cachedVideoRenditions
      if $0.pendingVideoSelections == 0 {
        $0.selectedVideoTrackId = requestedVideoTrackId
      }
    }
  }

  /// Main thread only.
  private func publishAudioTracks(_ tracks: [AudioTrack], selectedTrackId: String?) {
    withPublishedTracks {
      $0.audioTracks = tracks
      if $0.pendingAudioSelections == 0 {
        $0.selectedAudioTrackId = selectedTrackId
      }
    }
  }

  var isCurrentlyBuffering: Bool = false

  /// The value the last `onBuffer` event carried, so the event is sent when buffering starts
  /// or stops and not every time the playback state is re-evaluated.
  var lastReportedBuffering: Bool?

  // Set while redrawPausedTextCue() moves the paused position, so that step is not reported as buffering
  var isRedrawingTextCue = false

  // A style change alone only reaches the next cue: moving the paused position by 1/90000 s
  // redraws the one on screen. Re-selecting the track does it too, but hides the cue on HLS.
  func redrawPausedTextCue() {
    guard let currentItem = player.currentItem, player.rate == 0 else { return }
    let step = CMTime(value: 1, timescale: 90000)
    var target = CMTimeAdd(currentItem.currentTime(), step)
    if currentItem.duration.isNumeric && target > currentItem.duration {
      target = CMTimeSubtract(currentItem.currentTime(), step)
    }
    isRedrawingTextCue = true
    player.seek(to: target, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] _ in
      DispatchQueue.main.async { self?.isRedrawingTextCue = false }
    }
  }

  var isPlaying: Bool {
    return player.rate != 0
  }

  var showNotificationControls: Bool = false {
    didSet {
      if showNotificationControls {
        NowPlayingInfoCenterManager.shared.registerPlayer(player: player)
      } else {
        NowPlayingInfoCenterManager.shared.removePlayer(player: player)
      }
    }
  }

  func initialize() throws -> Promise<Void> {
    let context: LoadContext?
    do {
      context = try beginLoadIfPlayerItemMissing()
    } catch {
      let promise = Promise<Void>()
      promise.reject(withError: PlayerError.cancelled.error())
      return promise
    }

    guard let context else {
      let promise = Promise<Void>()
      promise.resolve(withResult: ())
      return promise
    }

    return Promise.async { [weak self] in
      guard let self else {
        throw LibraryError.deallocated(objectName: "HybridVideoPlayer").error()
      }

      do {
        let loadedPlayerItem = try await self.loadPlayerItem(for: context)
        try await self.commitPlayerItem(loadedPlayerItem)
      } catch {
        if error is CancellationError {
          throw PlayerError.cancelled.error()
        }
        throw error
      }
    }
  }

  func release() {
    guard let releasedSource = close() else { return }

    try? _eventEmitter?.clearAllListeners()
    releaseAsset(for: releasedSource)

    // Always defer teardown by one main-loop turn. AVPlayer and plugin callbacks can
    // synchronously re-enter release while their own lifecycle transition is in progress.
    DispatchQueue.main.async { [self] in
      releaseOnMainThread()
    }
  }

  private func releaseOnMainThread() {
    videoRenditionLoadTask?.cancel()
    videoRenditionLoadTask = nil
    videoQualityRecheckWorkItem?.cancel()
    videoQualityRecheckWorkItem = nil
    cachedVideoRenditions = []
    cachedVideoRenditionsURL = nil
    cachedVideoRenditionsHeaders = [:]
    activeVideoTrackId = nil
    requestedVideoTrackId = nil
    hasPinnedVideoQuality = false

    requestedAudioTrackId = nil
    lastEmittedAudioTrackSignature = nil
    publishAudioTracks([], selectedTrackId: nil)

    playerObserver?.invalidatePlayerItemObservers()
    playerObserver?.invalidatePlayerObservers()
    playerObserver = nil

    NowPlayingInfoCenterManager.shared.removePlayer(player: player)
    playerItem = nil
    player.replaceCurrentItem(with: nil)
    status = .idle

    VideoManager.shared.unregister(player: self)
  }

  private func commitPlayerItem(_ loadedPlayerItem: LoadedPlayerItem) async throws {
    try await MainActor.run {
      try self.sourceLoader.commit(loadedPlayerItem.context.token) {
        self.storedPlayerItem = loadedPlayerItem.item
      }

      let bufferConfig = loadedPlayerItem.context.source.config.bufferConfig
      if let bufferConfig {
        loadedPlayerItem.item.setBufferConfig(config: bufferConfig)
      }
      // Off-main manifest fetch for the quality ladder.
      self.beginVideoRenditionLoad(for: loadedPlayerItem.context.source)
      // The audio tracks of the previous source are gone; the new ones are published once
      // the item is ready (`applyAudioTrackSelectionIfReady`).
      self.publishAudioTracks([], selectedTrackId: self.requestedAudioTrackId)

      self.player.replaceCurrentItem(with: loadedPlayerItem.item)

      // A player property, not an item one: set for every source so a source without the
      // option gets the AVPlayer default back. Written once the new item is in place and
      // only when the value changes, because the setter makes AVPlayer publish
      // `timeControlStatus` again.
      let waitsToMinimizeStalling = bufferConfig?.automaticallyWaitsToMinimizeStalling ?? true
      if self.player.automaticallyWaitsToMinimizeStalling != waitsToMinimizeStalling {
        self.player.automaticallyWaitsToMinimizeStalling = waitsToMinimizeStalling
      }
    }
  }

  private func loadPlayerItem(for context: LoadContext) async throws -> LoadedPlayerItem {
    try ensureCurrentLoad(context)
    let playerItem = try await sourceLoader.load(
      token: context.token
    ) {
      try self.ensureCurrentLoad(context)
      return try await self.initializePlayerItem(source: context.source, context: context)
    }
    try ensureCurrentLoad(context)
    return LoadedPlayerItem(item: playerItem, context: context)
  }

  func preload() throws -> NitroModules.Promise<Void> {
    let promise = Promise<Void>()

    let context: LoadContext?
    do {
      context = try beginPreloadIfNeeded()
    } catch {
      promise.reject(withError: PlayerError.cancelled.error())
      return promise
    }

    guard let context else {
      promise.resolve(withResult: ())
      return promise
    }

    Task.detached(priority: .userInitiated) { [weak self] in
      guard let self else {
        promise.reject(
          withError: LibraryError.deallocated(objectName: "HybridVideoPlayer")
            .error()
        )
        return
      }

      do {
        let loadedPlayerItem = try await self.loadPlayerItem(for: context)
        try await self.commitPlayerItem(loadedPlayerItem)
        promise.resolve(withResult: ())
      } catch {
        if error is CancellationError {
          promise.reject(withError: PlayerError.cancelled.error())
        } else {
          promise.reject(withError: error)
        }
      }
    }

    return promise
  }

  func play() throws {
    player.play()
  }

  func pause() throws {
    wasPlayingInBackground = false
    player.pause()
  }

  func seekBy(time: Double) throws {
    guard let currentItem = player.currentItem else {
      throw PlayerError.notInitialized.error()
    }

    // Duration is NaN for live streams
    let fixedDurration = duration.isNaN ? Double.infinity : duration

    // Clap by <0, duration>
    let newTime = max(0, min(currentItem.croppedCurrentTime + time, fixedDurration))

    currentTime = newTime
  }

  func seekTo(time: Double) {
    currentTime = time
  }

  func replaceSourceAsync(
    source: Variant_NullType__any_HybridVideoPlayerSourceSpec_?
  ) throws
    -> Promise<Void>
  {
    let promise = Promise<Void>()

    /**
     @frozen
     public indirect enum Variant_NullType__any_HybridVideoPlayerSourceSpec_ {
       case first(NullType)
       case second((any HybridVideoPlayerSourceSpec))
     }
     */

    // if source is nil, release player
    // if source is not NullType, set source
    guard let source else {
      release()
      promise.resolve(withResult: ())
      return promise
    }

    switch source {
    case .first(_):
      release()
      promise.resolve(withResult: ())
      return promise
    case .second(let newSource):
      let replacementContext: LoadContext
      do {
        replacementContext = try replaceSourceAndBeginLoad(with: newSource)
      } catch {
        promise.reject(withError: PlayerError.cancelled.error())
        return promise
      }

      Task.detached(priority: .userInitiated) { [weak self] in
        guard let self else {
          promise.reject(
            withError: LibraryError.deallocated(objectName: "HybridVideoPlayer")
              .error()
          )
          return
        }

        do {
          let loadedPlayerItem = try await self.loadPlayerItem(for: replacementContext)
          try await self.commitPlayerItem(loadedPlayerItem)
          promise.resolve(withResult: ())
        } catch {
          if error is CancellationError {
            promise.reject(withError: PlayerError.cancelled.error())
          } else {
            promise.reject(withError: error)
          }
        }
      }
    }

    return promise
  }

  // MARK: - Methods

  func initializePlayerItem() async throws -> AVPlayerItem {
    let context = try beginLoad()
    return try await loadPlayerItem(for: context).item
  }

  private func initializePlayerItem(
    source: any HybridVideoPlayerSourceSpec,
    context: LoadContext
  ) async throws -> AVPlayerItem {
    // Ensure the source is a valid HybridVideoPlayerSource
    guard let hybridSource = source as? HybridVideoPlayerSource else {
      status = .error
      throw PlayerError.invalidSource.error()
    }

    // (maybe) Override source with plugins
    let _source = await PluginsRegistry.shared.overrideSource(
      source: hybridSource
    )
    try ensureCurrentLoad(context)

    let isLocalSource = _source.url.isFileURL || _source.url.scheme?.lowercased() == "ph"
    _eventEmitter?.onLoadStart(
      .init(sourceType: isLocalSource ? .local : .network, source: _source)
    )

    let asset: AVAsset
    if let source = _source as? HybridVideoPlayerSource {
      asset = try await source.getAsset(
        isCurrent: { self.sourceLoader.isCurrent(context.token) }
      )
    } else {
      try ensureCurrentLoad(context)
      asset = try await _source.getAsset()
    }
    try ensureCurrentLoad(context)

    let playerItem: AVPlayerItem

    if let externalSubtitles = source.config.externalSubtitles,
      externalSubtitles.isEmpty == false
    {
      playerItem = try await AVPlayerItem.withExternalSubtitles(
        for: asset,
        config: source.config
      )
    } else {
      playerItem = AVPlayerItem(asset: asset)
    }
    try ensureCurrentLoad(context)

    playerItem.setCrop(start: source.config.cropStart, end: source.config.cropEnd)

    // Seeking an item that has no player yet sets where its playback starts.
    // `startPosition` counts from `cropStart`.
    let startSeconds = playerItem.cropStartSeconds + max(0, source.config.startPosition ?? 0) / 1000
    if startSeconds > 0 {
      playerItem.seek(
        to: CMTime(seconds: startSeconds, preferredTimescale: 1000),
        toleranceBefore: .zero,
        toleranceAfter: .zero,
        completionHandler: nil
      )
    }

    if let metadata = source.config.metadata {
      let title = metadata.title
      let artist = metadata.artist
      let imageUri = metadata.imageUri

      DispatchQueue.main.async { [weak playerItem] in
        guard let playerItem else { return }
        var items: [AVMetadataItem] = []

        if let title {
          items.append(.make(identifier: .commonIdentifierTitle, value: title as NSString))
        }
        if let artist {
          items.append(.make(identifier: .commonIdentifierArtist, value: artist as NSString))
        }
        if !items.isEmpty {
          playerItem.externalMetadata = items
          NowPlayingInfoCenterManager.shared.updateStaticInfo(ifCurrentItem: playerItem)
        }
      }

      // Load artwork in background to not block player initialization
      if let imageUri, let imageUrl = URL(string: imageUri) {
        Task { [weak playerItem] in
          guard let (data, _) = try? await URLSession.shared.data(from: imageUrl) else {
            print("[RNV] Failed to load artwork from: \(imageUrl)")
            return
          }
          DispatchQueue.main.async {
            guard let playerItem else { return }
            playerItem.externalMetadata = playerItem.externalMetadata + [.make(identifier: .commonIdentifierArtwork, value: data as NSData)]
            NowPlayingInfoCenterManager.shared.updateStaticInfo(ifCurrentItem: playerItem)
          }
        }
      } else if let imageUri {
        print("[RNV] Invalid imageUri for artwork: \(imageUri)")
      }
    }

    return playerItem
  }

  // MARK: - Text Track Management

  func getAvailableTextTracks() throws -> [TextTrack] {
    guard let currentItem = player.currentItem else {
      return []
    }

    var tracks: [TextTrack] = []

    if let sideloaded = currentItem.sideloadedTextTracks {
      for (index, track) in sideloaded.tracks.enumerated() {
        tracks.append(
          TextTrack(
            id: "external-\(index)",
            label: track.label,
            language: track.language,
            selected: index == sideloaded.selectedIndex
          )
        )
      }
      return tracks
    }

    if let mediaSelection = currentItem.asset.mediaSelectionGroup(
      forMediaCharacteristic: .legible
    ) {
      for (index, option) in mediaSelection.options.enumerated() {
        let isSelected =
          currentItem.currentMediaSelection.selectedMediaOption(
            in: mediaSelection
          ) == option

        let name =
          option.commonMetadata.first(where: { $0.commonKey == .commonKeyTitle }
          )?.stringValue
          ?? option.displayName

        let isExternal =
          source.config.externalSubtitles?.contains { subtitle in
            name.contains(subtitle.label)
          } ?? false

        let trackId =
          isExternal
          ? "external-\(index)"
          : "builtin-\(option.displayName)-\(option.locale?.identifier ?? "unknown")"

        tracks.append(
          TextTrack(
            id: trackId,
            label: option.displayName,
            language: option.locale?.identifier,
            selected: isSelected
          )
        )
      }
    }

    return tracks
  }

  func selectTextTrack(textTrack: Variant_NullType_TextTrack?) throws {
    guard let currentItem = player.currentItem else {
      throw PlayerError.notInitialized.error()
    }

    if let sideloaded = currentItem.sideloadedTextTracks {
      selectSideloadedTextTrack(textTrack, in: sideloaded, of: currentItem)
      return
    }

    guard
      let mediaSelection = currentItem.asset.mediaSelectionGroup(
        forMediaCharacteristic: .legible
      )
    else {
      return
    }

    // If textTrack is nil, deselect any selected track
    guard let textTrack = textTrack else {
      currentItem.select(nil, in: mediaSelection)
      selectedExternalTrackIndex = nil
      emitSelectedTextTrackIfChanged()
      return
    }

    switch textTrack {
    case .first(_):
      currentItem.select(nil, in: mediaSelection)
      selectedExternalTrackIndex = nil
      emitSelectedTextTrackIfChanged()
      return
    case .second(let textTrack):
      // If textTrack id is empty, deselect any selected track
      if textTrack.id.isEmpty {
        currentItem.select(nil, in: mediaSelection)
        selectedExternalTrackIndex = nil
        emitSelectedTextTrackIfChanged()
        return
      }

      if textTrack.id.hasPrefix("external-") {
        let trackIndexStr = String(textTrack.id.dropFirst("external-".count))
        if let trackIndex = Int(trackIndexStr),
          trackIndex < mediaSelection.options.count
        {
          let option = mediaSelection.options[trackIndex]
          currentItem.select(option, in: mediaSelection)
          selectedExternalTrackIndex = trackIndex
          emitSelectedTextTrackIfChanged()
        }
      } else if textTrack.id.hasPrefix("builtin-") {
        for option in mediaSelection.options {
          let optionId =
            "builtin-\(option.displayName)-\(option.locale?.identifier ?? "unknown")"
          if optionId == textTrack.id {
            currentItem.select(option, in: mediaSelection)
            selectedExternalTrackIndex = nil
            emitSelectedTextTrackIfChanged()
            return
          }
        }
      }
    }
  }

  // Reports a selection change once, made here or in the native controls (they post it as well).
  func emitSelectedTextTrackIfChanged() {
    let track = selectedTrack
    guard track?.id != emittedTextTrackId else { return }
    emittedTextTrackId = track?.id
    _eventEmitter?.onTrackChange(track.map { .second($0) })
  }

  private func selectSideloadedTextTrack(
    _ textTrack: Variant_NullType_TextTrack?,
    in sideloaded: SideloadedTextTracks,
    of item: AVPlayerItem
  ) {
    if case .second(let track) = textTrack, !track.id.isEmpty {
      guard
        track.id.hasPrefix("external-"),
        let index = Int(track.id.dropFirst("external-".count)),
        sideloaded.tracks.indices.contains(index)
      else {
        return
      }
      sideloaded.selectedIndex = index
    } else {
      sideloaded.selectedIndex = nil
    }

    selectedExternalTrackIndex = sideloaded.selectedIndex
    sideloaded.apply(to: item)
    emitSelectedTextTrackIfChanged()
  }

  var selectedTrack: TextTrack? {
    guard let currentItem = player.currentItem else {
      return nil
    }

    if let sideloaded = currentItem.sideloadedTextTracks {
      guard let index = sideloaded.selectedIndex else {
        return nil
      }
      let track = sideloaded.tracks[index]
      return TextTrack(
        id: "external-\(index)",
        label: track.label,
        language: track.language,
        selected: true
      )
    }

    guard
      let mediaSelection = currentItem.asset.mediaSelectionGroup(
        forMediaCharacteristic: .legible
      )
    else {
      return nil
    }

    guard
      let selectedOption = currentItem.currentMediaSelection
        .selectedMediaOption(in: mediaSelection)
    else {
      return nil
    }

    guard let index = mediaSelection.options.firstIndex(of: selectedOption)
    else {
      return nil
    }

    // Same rule as getAvailableTextTracks(), so the id matches the one in the list
    let name =
      selectedOption.commonMetadata.first(where: { $0.commonKey == .commonKeyTitle })?
      .stringValue
      ?? selectedOption.displayName

    let isExternal =
      source.config.externalSubtitles?.contains { subtitle in
        name.contains(subtitle.label)
      } ?? false

    let trackId =
      isExternal
      ? "external-\(index)"
      : "builtin-\(selectedOption.displayName)-\(selectedOption.locale?.identifier ?? "unknown")"

    return TextTrack(
      id: trackId,
      label: selectedOption.displayName,
      language: selectedOption.locale?.identifier,
      selected: true
    )
  }

  // MARK: - Video Track (Quality) Management
  //
  // AVFoundation has no concept of "play this exact HLS variant". The closest it
  // offers is a set of caps on the AVPlayerItem that constrain which variants
  // its ABR algorithm may choose. Everything below is built on that, which is
  // why the reported state distinguishes what was *requested*
  // (`selectedTrackId`) from what is actually *playing* (`activeTrackId`).

  func getAvailableVideoTracks() throws -> [VideoTrack] {
    let (renditions, selectedTrackId) = withPublishedTracks {
      ($0.videoRenditions, $0.selectedVideoTrackId)
    }
    return renditions.map { $0.videoTrack(selected: $0.id == selectedTrackId) }
  }

  var selectedVideoTrackId: String? {
    withPublishedTracks { $0.selectedVideoTrackId }
  }

  func selectVideoTrack(trackId: String?) throws {
    // Published first, so a getter called right after this returns what was just selected.
    withPublishedTracks {
      $0.selectedVideoTrackId = trackId
      $0.pendingVideoSelections += 1
    }

    runOnMainThread { [weak self] in
      guard let self else { return }
      self.withPublishedTracks { $0.pendingVideoSelections -= 1 }
      self.requestedVideoTrackId = trackId
      // Applied right now if the item is already ready; otherwise the
      // `.readyToPlay` hook in HybridVideoPlayer+Events.swift picks it up, since
      // AVFoundation ignores these properties before then.
      self.applyVideoQualityCaps()
      self.emitVideoTrackChange()
    }
  }

  private func videoTracksSnapshot() -> [VideoTrack] {
    cachedVideoRenditions.map { $0.videoTrack(selected: $0.id == requestedVideoTrackId) }
  }

  private func emitVideoTrackChange() {
    _eventEmitter?.onVideoTrackChange(
      VideoTrackChangeData(
        availableTracks: videoTracksSnapshot(),
        selectedTrackId: requestedVideoTrackId,
        activeTrackId: activeVideoTrackId
      )
    )
  }

  /// Fetches and caches the rendition ladder for a newly committed source.
  /// Main thread only.
  private func beginVideoRenditionLoad(for source: any HybridVideoPlayerSourceSpec) {
    guard let url = (source as? NativeVideoPlayerSourceSpec)?.url else { return }
    let headers = source.config.headers ?? [:]
    guard cachedVideoRenditionsURL != url || cachedVideoRenditionsHeaders != headers else { return }

    videoRenditionLoadTask?.cancel()
    cachedVideoRenditionsURL = url
    cachedVideoRenditionsHeaders = headers
    cachedVideoRenditions = []
    activeVideoTrackId = nil

    guard url.pathExtension == "m3u8" else {
      // Progressive sources have a single rendition, so there is nothing to
      // choose from and any pin carried over from a previous source is void.
      requestedVideoTrackId = nil
      applyVideoQualityCaps()
      emitVideoTrackChange()
      return
    }

    videoRenditionLoadTask = Task.detached(priority: .utility) { [weak self] in
      var renditions: [VideoRendition] = []
      do {
        renditions = try await VideoTrackUtils.loadRenditions(from: url, headers: headers)
      } catch {
        // Playback is unaffected, but the quality list stays empty - say why
        // (e.g. a 403 from a gated playlist) instead of failing silently.
        print("[RNV] Could not load HLS renditions from \(url.absoluteString): \(error)")
      }
      guard !Task.isCancelled else { return }

      await MainActor.run {
        guard let self, self.cachedVideoRenditionsURL == url,
          self.cachedVideoRenditionsHeaders == headers
        else { return }
        self.cachedVideoRenditions = renditions
        // A pin names a rung of a specific ladder. If the new source has no such
        // rung, fall back to automatic rather than keep reporting a selection
        // that cannot be honoured.
        if let requested = self.requestedVideoTrackId,
          !renditions.contains(where: { $0.id == requested })
        {
          self.requestedVideoTrackId = nil
        }
        self.applyVideoQualityCaps()
        self.emitVideoTrackChange()
      }
    }
  }

  /// Hook for the `.readyToPlay` transition and for source replacement: a pin
  /// outlives the item it was written to, so every new item has to have it
  /// written again.
  func applyVideoQualityCapsIfReady() {
    runOnMainThreadSync { applyVideoQualityCaps() }
  }

  /// Main thread only.
  private func applyVideoQualityCaps() {
    // Deliberately the library's own committed content item, not
    // `player.currentItem`: during an ad break the content item may not be
    // attached at all, and capping whatever the player happens to be holding
    // would write these properties onto the wrong item.
    guard let item = playerItem else { return }
    // On iOS 13+ these properties are ignored when set before the item is ready
    // to play, and silently so - nothing reports the write was dropped.
    guard item.status == .readyToPlay else { return }

    videoQualityRecheckWorkItem?.cancel()
    videoQualityRecheckWorkItem = nil

    guard
      let requestedVideoTrackId,
      let index = cachedVideoRenditions.firstIndex(where: { $0.id == requestedVideoTrackId })
    else {
      guard hasPinnedVideoQuality else { return }
      hasPinnedVideoQuality = false
      clearVideoQualityCaps(on: item)
      return
    }

    let rendition = cachedVideoRenditions[index]

    // Deliberately not the rendition's own bitrate. AVFoundation does not
    // document whether it compares `<` or `<=` against the cap, and an exact cap
    // cannot separate the same-resolution/different-bitrate rendition pairs real
    // ladders contain. The midpoint to the next-higher rendition admits this one
    // and excludes the next. The top rendition has no next, so it gets headroom.
    let cap: Double =
      index == 0
      ? Double(rendition.bitrate) * 1.5
      : (Double(rendition.bitrate) + Double(cachedVideoRenditions[index - 1].bitrate)) / 2.0
    let size = CGSize(width: rendition.width, height: rendition.height)

    hasPinnedVideoQuality = true

    // Two-step write. Setting these once is not reliable; zeroing first and
    // writing the real values on a later runloop turn is.
    zeroVideoQualityCaps(on: item)

    DispatchQueue.main.async { [weak self, weak item] in
      guard let self, let item else { return }
      guard self.requestedVideoTrackId == rendition.id else { return }
      self.writeVideoQualityCaps(cap: cap, size: size, on: item)
      self.armVideoQualityRecheck(for: rendition, cap: cap, size: size)
    }
  }

  private func zeroVideoQualityCaps(on item: AVPlayerItem) {
    // Apple's documented "no limit" sentinels.
    item.preferredPeakBitRate = 0
    item.preferredPeakBitRateForExpensiveNetworks = 0
    item.preferredMaximumResolution = .zero
    item.preferredMaximumResolutionForExpensiveNetworks = .zero
  }

  private func clearVideoQualityCaps(on item: AVPlayerItem) {
    zeroVideoQualityCaps(on: item)

    // Auto must not silently defeat Data Saver: whatever caps the app configured
    // through `bufferConfig` go straight back on.
    if let bufferConfig = source.config.bufferConfig {
      item.setBufferConfig(config: bufferConfig)
    }
  }

  private func writeVideoQualityCaps(cap: Double, size: CGSize, on item: AVPlayerItem) {
    item.preferredPeakBitRate = cap
    item.preferredMaximumResolution = size
    // The `ForExpensiveNetworks` variants take precedence over the base ones on
    // cellular. Without them a manual pick would be silently overridden by Data
    // Saver's cellular cap, and a manual pick is supposed to win outright.
    item.preferredPeakBitRateForExpensiveNetworks = cap
    item.preferredMaximumResolutionForExpensiveNetworks = size
  }

  /// One-shot re-application. AVFoundation is unreliable specifically when the
  /// cap is *raised* - it will happily stay on the low variant it already has.
  /// A seek would force the switch but re-buffers and stalls, which defeats the
  /// point of a seamless quality change, so this only writes the caps once more
  /// and otherwise lets `activeTrackId` report the truth.
  private func armVideoQualityRecheck(for rendition: VideoRendition, cap: Double, size: CGSize) {
    videoQualityRecheckWorkItem?.cancel()

    let work = DispatchWorkItem { [weak self] in
      guard let self else { return }
      self.videoQualityRecheckWorkItem = nil
      guard self.requestedVideoTrackId == rendition.id,
        let item = self.playerItem,
        let indicated = item.accessLog()?.events.last?.indicatedBitrate,
        let actual = VideoTrackUtils.nearestRendition(to: indicated, in: self.cachedVideoRenditions),
        actual.id != rendition.id
      else { return }

      self.writeVideoQualityCaps(cap: cap, size: size, on: item)
    }

    videoQualityRecheckWorkItem = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 4.0, execute: work)
  }

  /// Parallel hop off the access log that already feeds `onBandwidthUpdate`.
  /// Only emits when the mapped rendition actually changes - the access log
  /// fires often, and re-emitting an unchanged ladder on every entry would be
  /// pure noise on the JS side.
  func updateActiveVideoTrack(indicatedBitrate: Double) {
    runOnMainThreadSync {
      guard !cachedVideoRenditions.isEmpty else { return }
      guard
        let match = VideoTrackUtils.nearestRendition(
          to: indicatedBitrate,
          in: cachedVideoRenditions
        ), match.id != activeVideoTrackId
      else { return }

      activeVideoTrackId = match.id
      emitVideoTrackChange()
    }
  }

  // MARK: - Audio Track Management
  //
  // The text-track code above is the template, not a rough guide: alternate
  // audio renditions live in exactly the same construct (an
  // `AVMediaSelectionGroup`), differing only in media characteristic
  // (`.audible` instead of `.legible`). `AVPlayerItem.select(_:in:)` switches
  // the rendition outright and takes effect on the next few sample buffers -
  // this is a real selection, not a preference the player may ignore.

  func getAvailableAudioTracks() throws -> [AudioTrack] {
    let (tracks, selectedTrackId, pending) = withPublishedTracks {
      ($0.audioTracks, $0.selectedAudioTrackId, $0.pendingAudioSelections)
    }
    // A selection JS has just made and the main thread has not applied yet is shown as
    // selected, like `selectedAudioTrackId` reports it.
    guard pending > 0, let selectedTrackId, tracks.contains(where: { $0.id == selectedTrackId })
    else { return tracks }
    return tracks.map {
      AudioTrack(
        id: $0.id,
        label: $0.label,
        language: $0.language,
        selected: $0.id == selectedTrackId,
        channels: $0.channels
      )
    }
  }

  var selectedAudioTrackId: String? {
    // Deliberately the item's *actual* current selection rather than the
    // latched request: the selection is exact, so there is a real answer to
    // report, and under automatic selection AVFoundation still picks a concrete
    // option (system language / accessibility settings) that callers want to
    // see reflected in their menu.
    withPublishedTracks { $0.selectedAudioTrackId }
  }

  func selectAudioTrack(trackId: String?) throws {
    withPublishedTracks {
      // Published first when it names a track of this source (or the list is not known
      // yet), so a getter called right after this returns it. Automatic (nil) and an id
      // of another source are resolved by the main thread below.
      if let trackId, $0.audioTracks.isEmpty || $0.audioTracks.contains(where: { $0.id == trackId }) {
        $0.selectedAudioTrackId = trackId
      }
      $0.pendingAudioSelections += 1
    }

    runOnMainThread { [weak self] in
      guard let self else { return }
      self.withPublishedTracks { $0.pendingAudioSelections -= 1 }
      self.requestedAudioTrackId = trackId
      // Takes effect immediately when the asset's media selection groups are
      // already loaded, which is the normal case; otherwise it is replayed by
      // `applyAudioTrackSelectionIfReady()` from the `.readyToPlay` hook in
      // HybridVideoPlayer+Events.swift.
      self.applyAudioTrackSelection()
      self.emitAudioTrackChange(force: true)
    }
  }

  /// The committed content item and its audible selection group, or nil when
  /// either does not exist yet.
  ///
  /// Prefers the library's own committed item over `player.currentItem`, so the
  /// selection always targets the item this player loaded for the current
  /// source rather than whatever the `AVPlayer` happens to be holding.
  /// Main thread only.
  private func audioSelectionContext() -> (item: AVPlayerItem, group: AVMediaSelectionGroup)? {
    guard let item = playerItem ?? player.currentItem else { return nil }
    guard
      let group = item.asset.mediaSelectionGroup(forMediaCharacteristic: .audible)
    else { return nil }
    return (item, group)
  }

  /// Positional, like the video-track ids and for the same reason: nothing on
  /// `AVMediaSelectionOption` is both stable and unique (two English options -
  /// stereo and 5.1, or original and described - share a display name and a
  /// language tag). The index disambiguates; the rest keeps the id readable and
  /// lets a stale id from another source be recognised as unresolvable.
  private func audioTrackId(for option: AVMediaSelectionOption, at index: Int) -> String {
    let language = option.extendedLanguageTag ?? option.locale?.identifier ?? "unknown"
    return "audio-\(index)-\(option.displayName)-\(language)"
  }

  /// Main thread only.
  private func audioTracksSnapshot() -> [AudioTrack] {
    guard let (item, group) = audioSelectionContext() else { return [] }

    let selectedOption = item.currentMediaSelection.selectedMediaOption(in: group)

    return group.options.enumerated().map { index, option in
      AudioTrack(
        id: audioTrackId(for: option, at: index),
        label: option.displayName,
        language: option.extendedLanguageTag ?? option.locale?.identifier,
        selected: option == selectedOption,
        channels: audioChannelCount(for: option, selectedOption: selectedOption, in: item)
      )
    }
  }

  /// Best effort, and deliberately only for the option actually being rendered.
  ///
  /// `AVMediaSelectionOption` carries no channel count of its own - for HLS the
  /// `CHANNELS` attribute of `#EXT-X-MEDIA` is not surfaced by AVFoundation at
  /// all - so the only public source is the format description of the audio
  /// track the player has loaded, which by definition describes the *selected*
  /// option. Reporting that same count against the other options would be a
  /// guess, so they get nil (the field is optional for exactly this reason).
  /// Main thread only.
  private func audioChannelCount(
    for option: AVMediaSelectionOption,
    selectedOption: AVMediaSelectionOption?,
    in item: AVPlayerItem
  ) -> Double? {
    guard option == selectedOption else { return nil }

    let audioTracks = item.tracks
      .compactMap { $0.assetTrack }
      .filter { $0.mediaType == .audio }
    guard audioTracks.count == 1 else { return nil }

    for case let formatDescription as CMFormatDescription in audioTracks[0].formatDescriptions {
      guard
        let asbd = CMAudioFormatDescriptionGetStreamBasicDescription(formatDescription)
      else { continue }
      let channels = asbd.pointee.mChannelsPerFrame
      if channels > 0 { return Double(channels) }
    }

    return nil
  }

  /// Main thread only.
  private func currentAudioTrackId() -> String? {
    guard let (item, group) = audioSelectionContext() else { return nil }
    guard
      let selectedOption = item.currentMediaSelection.selectedMediaOption(in: group),
      let index = group.options.firstIndex(of: selectedOption)
    else { return nil }
    return audioTrackId(for: selectedOption, at: index)
  }

  /// Writes `requestedAudioTrackId` onto the committed content item.
  ///
  /// Returns false only when media selection *is* available and the request
  /// names no option in it - i.e. the id belongs to a different source.
  /// Main thread only.
  @discardableResult
  private func applyAudioTrackSelection() -> Bool {
    guard let (item, group) = audioSelectionContext() else { return true }

    guard let requestedAudioTrackId else {
      // Automatic. Deliberately *not* `select(nil, in: group)`: for an audible
      // group that means "no audio at all", and it is silently ignored unless
      // the group sets `allowsEmptySelection` (audible groups generally do
      // not). `selectMediaOptionAutomatically` is the real "back to default"
      // call - it hands the choice back to AVFoundation's media selection
      // criteria (system language, accessibility preferences).
      item.selectMediaOptionAutomatically(in: group)
      return true
    }

    for (index, option) in group.options.enumerated()
    where audioTrackId(for: option, at: index) == requestedAudioTrackId {
      item.select(option, in: group)
      return true
    }

    return false
  }

  /// Hook for the `.readyToPlay` transition: media selection groups do not
  /// exist before the asset is loaded, so a selection made earlier - or carried
  /// over from the previous source - has to be written again here, and this is
  /// also where the available set is first published.
  func applyAudioTrackSelectionIfReady() {
    runOnMainThreadSync {
      if !applyAudioTrackSelection() {
        // The group is known and has no such option: the id named a rendition
        // of a different source. Drop it rather than keep reporting a selection
        // that cannot be honoured.
        requestedAudioTrackId = nil
        applyAudioTrackSelection()
      }
      emitAudioTrackChange()
    }
  }

  /// Main thread only. `force` is for an explicit `selectAudioTrack` call,
  /// which must always be acknowledged even if it changed nothing.
  private func emitAudioTrackChange(force: Bool = false) {
    let tracks = audioTracksSnapshot()
    let selectedTrackId = currentAudioTrackId() ?? requestedAudioTrackId
    publishAudioTracks(tracks, selectedTrackId: selectedTrackId)

    let signature =
      tracks
      .map { track -> String in
        let channels: String = track.channels.map { "\($0)" } ?? "-"
        return "\(track.id)|\(track.selected)|\(channels)"
      }
      .joined(separator: ",") + "#" + (selectedTrackId ?? "-")

    guard force || signature != lastEmittedAudioTrackSignature else { return }
    lastEmittedAudioTrackSignature = signature

    _eventEmitter?.onAudioTrackChange(
      AudioTrackChangeData(
        availableTracks: tracks,
        selectedTrackId: selectedTrackId
      )
    )
  }

  /// Second, deduped emission point. At `.readyToPlay` the asset's media
  /// selection groups exist but `AVPlayerItem.tracks` is often still empty, so
  /// the first snapshot has no channel count. Re-checking once playback is
  /// actually able to proceed fills it in, and the signature check makes the
  /// call free when nothing changed.
  func refreshAudioTracksIfChanged() {
    runOnMainThreadSync { emitAudioTrackChange() }
  }

  // MARK: - Memory Management

  func dispose() {
    release()
  }

  var memorySize: Int {
    isReleased ? 0 : playerItem?.asset.estimatedMemoryUsage ?? 0
  }
}
