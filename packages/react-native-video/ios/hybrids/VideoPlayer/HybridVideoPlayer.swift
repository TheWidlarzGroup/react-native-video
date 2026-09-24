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

  // MARK: - Ad gate state
  //
  // `adController` owns the ad state machine (see AdPlaybackGate). When it is
  // nil - no ad SDK linked, or no `ads` config on the source - the gate is
  // permanently open and everything below behaves exactly as it did before ads
  // existed.
  //
  // Main-thread-only state.

  private(set) var adController: VideoAdControlling?

  /// The user's latched playback intent, tracked separately from `AVPlayer`'s
  /// actual state. While the gate is closed the `AVPlayer` is deliberately not
  /// touched, so its rate cannot be used to remember what JS asked for.
  private var userWantsToPlay = false

  /// The rate JS last asked for. Applied to the `AVPlayer` only once the gate
  /// is open, so a `rate` assignment cannot start content behind an ad.
  private var requestedRate: Double?

  /// A loaded content item that `commitPlayerItem` was not allowed to attach
  /// because the gate was closed. Attached by `adControllerDidOpenGate`.
  private var pendingContentItem: AVPlayerItem?

  /// The single predicate guarding `AVPlayer.replaceCurrentItem(with:)`.
  private var allowsContentAttachment: Bool {
    adController?.allowsContentAttachment ?? true
  }

  /// Points the ad controller at a (possibly new) source's ad config, creating
  /// it on first use. A player whose sources never carry an `ads` config never
  /// builds one, so it pays none of the ad SDK's setup cost.
  ///
  /// Main thread only: ad SDKs build UIKit/WebKit objects in their
  /// initialisers, and Nitro can construct the player off the main thread.
  private func configureAdController(with ads: VideoAdsConfig?) {
    if adController == nil {
      guard ads != nil else { return }
      adController = VideoAdControllerFactory.make(delegate: self)
    }
    adController?.configure(with: ads)
  }

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

    runOnMainThreadSync {
      self.configureAdController(with: source.config.ads)
    }

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
      let releasedSource = runOnMainThreadSync { () -> (any HybridVideoPlayerSourceSpec)? in
        let released = sourceLoader.cancel {
          let releasedSource = storedSource
          storedSource = newValue
          return releasedSource
        }
        // Same generation-token reset as replaceSourceAsync.
        pendingContentItem = nil
        configureAdController(with: newValue.config.ads)
        return released
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
      // Assigning `player.rate` starts playback as a side effect, so this
      // setter has to go through the gate too - otherwise `rate = 1` would be
      // a back door straight past a pending ad decision.
      requestedRate = newValue

      guard allowsContentAttachment else { return }

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

  var isCurrentlyBuffering: Bool = false

  var isPlaying: Bool {
    // An ad break counts as playing: the content player is deliberately paused
    // underneath it, but lifecycle handling (VideoManager) must still treat the
    // player as active so that backgrounding pauses the ad and returning
    // resumes it.
    return player.rate != 0 || adController?.isPlayingAd == true
  }

  // MARK: - Ads

  var isPlayingAd: Bool {
    return adController?.isPlayingAd ?? false
  }

  var adState: VideoAdState {
    return adController?.adState ?? .idle
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
    // Ads first: a live IMAAdsManager can asynchronously touch the player (and
    // its own internal one) while the rest of this teardown runs.
    adController?.destroy()
    adController = nil
    pendingContentItem = nil
    userWantsToPlay = false

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

      // ===================================================================
      // THE GATE. This is the only place in the library that attaches a
      // content item to the AVPlayer, so it is the only place that has to be
      // guarded for "no content frame before the ad decision" to hold.
      // ===================================================================
      guard self.allowsContentAttachment else {
        self.pendingContentItem = loadedPlayerItem.item
        return
      }

      self.pendingContentItem = nil
      self.player.replaceCurrentItem(with: loadedPlayerItem.item)
      self.applyLatchedPlaybackIntent()
    }
  }

  // MARK: - Playback intent reconciliation

  /// Applies whatever JS asked for while the gate was closed. Only ever called
  /// with the gate open.
  private func applyLatchedPlaybackIntent() {
    guard player.currentItem != nil else { return }

    if let requestedRate, #available(iOS 16.0, tvOS 16.0, *) {
      player.defaultRate = Float(requestedRate)
    }

    guard userWantsToPlay else { return }
    player.play()
    applyRequestedRateIfNeeded()
  }

  private func applyRequestedRateIfNeeded() {
    guard let requestedRate, requestedRate != 1.0 else { return }
    player.rate = Float(requestedRate)
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

  /// Every JS- and lifecycle-initiated request to start playback funnels
  /// through here. Nothing else in the library may call `player.play()`.
  func play() throws {
    runOnMainThreadSync {
      userWantsToPlay = true

      if let adController {
        if adController.isPlayingAd {
          // Resume the *ad*, not the content underneath it.
          adController.resumeAd()
          return
        }

        // Ads are configured but nobody activated them yet. A play request is
        // the strongest possible signal of intent, so activate now rather than
        // sit behind a gate that would otherwise never be opened.
        if adController.isArmed {
          adController.activate(completion: {})
        }

        guard adController.allowsContentAttachment else {
          // Gated: intent is latched and applied by adControllerDidOpenGate.
          return
        }
      }

      player.play()
      applyRequestedRateIfNeeded()
    }
  }

  /// Every JS- and lifecycle-initiated request to stop playback funnels through
  /// here. Nothing else in the library may call `player.pause()`.
  func pause() throws {
    runOnMainThreadSync {
      wasPlayingInBackground = false
      userWantsToPlay = false

      if let adController, adController.isPlayingAd {
        // Pausing during an ad pauses the ad and clears intent, so content does
        // not auto-resume when the break ends.
        adController.pauseAd()
        return
      }

      player.pause()
    }
  }

  func activateAds() throws -> Promise<Void> {
    let promise = Promise<Void>()

    guard let adController else {
      // No ad SDK linked, or no ads configured: nothing gates content.
      promise.resolve(withResult: ())
      return promise
    }

    runOnMainThread {
      // Never rejects - the gate always fails open, and the promise resolves
      // as soon as the ad decision is known (the same moment `onAdsResolved`
      // fires), including via the fail-open watchdog.
      adController.activate {
        promise.resolve(withResult: ())
      }
    }

    return promise
  }

  func deactivateAds() throws {
    runOnMainThread { [weak self] in
      self?.adController?.deactivate()
    }
  }

  func skipAd() throws {
    runOnMainThread { [weak self] in
      self?.adController?.skipAd()
    }
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
      // Re-arm the ad session for the new source before anything can load.
      // `configure` destroys the previous IMAAdsManager and bumps the
      // generation token, so a late ad response for the old source is dropped.
      runOnMainThreadSync {
        pendingContentItem = nil
        configureAdController(with: newSource.config.ads)
      }

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

    let isNetworkSource = _source.url.isFileURL == false
    _eventEmitter?.onLoadStart(
      .init(sourceType: isNetworkSource ? .network : .local, source: _source)
    )

    let asset: AVURLAsset
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

  // MARK: - Memory Management

  func dispose() {
    release()
  }

  var memorySize: Int {
    isReleased ? 0 : playerItem?.asset.estimatedMemoryUsage ?? 0
  }
}

// MARK: - VideoAdControllerDelegate

extension HybridVideoPlayer: VideoAdControllerDelegate {

  var adControllerContentPlayer: AVPlayer { player }

  var adControllerEventEmitter: HybridVideoPlayerEventEmitter? { _eventEmitter }

  func adControllerWillPresentAdBreak(_ controller: VideoAdControlling) {
    // Stop content without touching `userWantsToPlay`, so that intent survives
    // the break and content resumes by itself when the gate reopens.
    player.pause()
  }

  func adControllerDidOpenGate(_ controller: VideoAdControlling) {
    if let pendingContentItem {
      self.pendingContentItem = nil
      player.replaceCurrentItem(with: pendingContentItem)
    }
    applyLatchedPlaybackIntent()
  }

  func adController(_ controller: VideoAdControlling, didChangeState state: VideoAdState) {
    _eventEmitter?.onAdStateChange(state)
    // Entering or leaving an ad break changes what is actually on screen, but
    // not the content player's rate, so `onPlaybackStateChange` has to be
    // re-derived here or JS would believe playback stopped for the whole break.
    updateAndEmitPlaybackState()
  }

  func adControllerDidChangeAdPlaybackState(_ controller: VideoAdControlling) {
    updateAndEmitPlaybackState()
  }
}
