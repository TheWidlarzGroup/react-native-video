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

  private func beginLoad() throws -> LoadContext {
    try runOnMainThreadSync {
      var source: (any HybridVideoPlayerSourceSpec)?
      guard let token = try sourceLoader.begin(onBegin: {
        source = storedSource
      }), let source else { throw CancellationError() }
      return LoadContext(source: source, token: token)
    }
  }

  private func beginLoadIfPlayerItemMissing() throws -> LoadContext? {
    try runOnMainThreadSync {
      var source: (any HybridVideoPlayerSourceSpec)?
      guard let token = try sourceLoader.begin(
        if: { storedPlayerItem == nil },
        onBegin: { source = storedSource }
      ) else { return nil }
      guard let source else { throw CancellationError() }
      return LoadContext(source: source, token: token)
    }
  }

  private func beginPreloadIfNeeded() throws -> LoadContext? {
    try runOnMainThreadSync {
      var source: (any HybridVideoPlayerSourceSpec)?
      guard let token = try sourceLoader.begin(
        if: { storedStatus == .idle },
        onBegin: { source = storedSource }
      ) else { return nil }
      guard let source else { throw CancellationError() }
      return LoadContext(source: source, token: token)
    }
  }

  private func replaceSourceAndBeginLoad(
    with newSource: any HybridVideoPlayerSourceSpec
  ) throws -> LoadContext {
    try runOnMainThreadSync {
      var previousSource: (any HybridVideoPlayerSourceSpec)?
      guard let token = try sourceLoader.begin(onBegin: {
        previousSource = storedSource
        storedSource = newSource
      }), let previousSource else { throw CancellationError() }
      let context = LoadContext(source: newSource, token: token)
      releaseAssetIfNotUsedByCurrentLoad(for: previousSource)
      return context
    }
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
    runOnMainThreadSync {
      sourceLoader.close(update: { storedSource })
    }
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
      let releasedSource = runOnMainThreadSync {
        sourceLoader.cancel {
          let releasedSource = storedSource
          storedSource = newValue
          return releasedSource
        }
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
      _eventEmitter?.onSeek(newValue)
      player.seek(
        to: CMTime(seconds: newValue, preferredTimescale: 1000),
        toleranceBefore: .zero,
        toleranceAfter: .zero
      )
    }
    get {
      player.currentTime().seconds
    }
  }

  var duration: Double {
    Double(player.currentItem?.duration.seconds ?? Double.nan)
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

  var loop: Bool = false

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

  var disableAudioSessionManagement: Bool = false {
    didSet {
      VideoManager.shared.requestAudioSessionUpdate()
    }
  }

  var wasAutoPaused: Bool = false

  /// Whether the player was playing when backgrounded — used to resume it on
  /// return if the system paused background playback.
  var wasPlayingInBackground: Bool = false

  // Text track selection state
  private var selectedExternalTrackIndex: Int? = nil

  // MARK: - Video track (quality) selection state
  //
  // Main-thread-only, like the ad gate state above. Quality selection is a pure
  // imperative call on the live player: nothing here touches `source` or
  // `bufferConfig`, so a quality pick can never make JS recreate the player.

  /// The id the user pinned through `selectVideoTrack`, or nil for automatic.
  /// Deliberately outlives the `AVPlayerItem` it was applied to - it is a
  /// request about the source, and every source replacement builds a new item.
  private var requestedVideoTrackId: String?

  /// The current source's rendition ladder, best first. Empty for non-HLS
  /// sources, and until the master playlist has been fetched.
  private var cachedVideoRenditions: [VideoRendition] = []

  /// Which URL `cachedVideoRenditions` describes. Fetching the master playlist
  /// is a real extra HTTP request (AVPlayer fetches it too but exposes none of
  /// it), so it is done once per source.
  private var cachedVideoRenditionsURL: URL?
  private var videoRenditionLoadTask: Task<Void, Never>?

  /// The rendition actually on screen, nearest-matched from the access log.
  private var activeVideoTrackId: String?

  /// True while caps written by a pin are still on the item. Returning to Auto
  /// needs to know it has something to undo, by which point
  /// `requestedVideoTrackId` is already nil.
  private var hasPinnedVideoQuality = false

  private var videoQualityRecheckWorkItem: DispatchWorkItem?

  var isCurrentlyBuffering: Bool = false

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
    activeVideoTrackId = nil
    requestedVideoTrackId = nil
    hasPinnedVideoQuality = false

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

      if let bufferConfig = loadedPlayerItem.context.source.config.bufferConfig {
        loadedPlayerItem.item.setBufferConfig(config: bufferConfig)
      }

      // Off-main manifest fetch for the quality ladder.
      self.beginVideoRenditionLoad(for: loadedPlayerItem.context.source)

      self.player.replaceCurrentItem(with: loadedPlayerItem.item)
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

    let currentItemTime = currentItem.currentTime()

    // Duration is NaN for live streams
    let fixedDurration = duration.isNaN ? Double.infinity : duration

    // Clap by <0, duration>
    let newTime = max(0, min(currentItemTime.seconds + time, fixedDurration))

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
      _eventEmitter?.onTrackChange(nil)
      return
    }

    switch textTrack {
    case .first(_):
      currentItem.select(nil, in: mediaSelection)
      selectedExternalTrackIndex = nil
      _eventEmitter?.onTrackChange(nil)
      return
    case .second(let textTrack):
      // If textTrack id is empty, deselect any selected track
      if textTrack.id.isEmpty {
        currentItem.select(nil, in: mediaSelection)
        selectedExternalTrackIndex = nil
        _eventEmitter?.onTrackChange(nil)
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
          _eventEmitter?.onTrackChange(.second(textTrack))
        }
      } else if textTrack.id.hasPrefix("builtin-") {
        for option in mediaSelection.options {
          let optionId =
            "builtin-\(option.displayName)-\(option.locale?.identifier ?? "unknown")"
          if optionId == textTrack.id {
            currentItem.select(option, in: mediaSelection)
            selectedExternalTrackIndex = nil
            _eventEmitter?.onTrackChange(.second(textTrack))
            return
          }
        }
      }
    }
  }

  var selectedTrack: TextTrack? {
    guard let currentItem = player.currentItem else {
      return nil
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

    let isExternal =
      source.config.externalSubtitles?.contains { subtitle in
        selectedOption.displayName.contains(subtitle.label)
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
    runOnMainThreadSync { videoTracksSnapshot() }
  }

  var selectedVideoTrackId: String? {
    runOnMainThreadSync { requestedVideoTrackId }
  }

  func selectVideoTrack(trackId: String?) throws {
    runOnMainThreadSync {
      requestedVideoTrackId = trackId
      // Applied right now if the item is already ready; otherwise the
      // `.readyToPlay` hook in HybridVideoPlayer+Events.swift picks it up, since
      // AVFoundation ignores these properties before then.
      applyVideoQualityCaps()
      emitVideoTrackChange()
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
    guard cachedVideoRenditionsURL != url else { return }

    videoRenditionLoadTask?.cancel()
    cachedVideoRenditionsURL = url
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
      let renditions = (try? await VideoTrackUtils.loadRenditions(from: url)) ?? []
      guard !Task.isCancelled else { return }

      await MainActor.run {
        guard let self, self.cachedVideoRenditionsURL == url else { return }
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

  // MARK: - Memory Management

  func dispose() {
    release()
  }

  var memorySize: Int {
    isReleased ? 0 : playerItem?.asset.estimatedMemoryUsage ?? 0
  }
}
