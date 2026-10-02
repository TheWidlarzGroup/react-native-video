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

  // MARK: - Audio track selection state
  //
  // Main-thread-only. Deliberately far smaller than the video-quality state
  // above: alternate audio renditions are a real AVFoundation media selection
  // group, exactly like text tracks, so a pick is an exact switch rather than a
  // cap on an ABR algorithm. There is nothing to approximate, hence no
  // requested/active split, no caps and no recheck timer.

  /// The id the user asked for through `selectAudioTrack`, or nil for
  /// automatic. Kept only because a call can legitimately arrive before the
  /// asset's media selection groups exist (nothing to select in yet), in which
  /// case it is replayed from the `.readyToPlay` hook.
  private var requestedAudioTrackId: String?

  /// Dedupe key for `onAudioTrackChange`. The emission points below fire more
  /// often than the track set actually changes.
  private var lastEmittedAudioTrackSignature: String?

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
    requestedAudioTrackId = nil
    lastEmittedAudioTrackSignature = nil

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

  // MARK: - Audio Track Management
  //
  // The text-track code above is the template, not a rough guide: alternate
  // audio renditions live in exactly the same construct (an
  // `AVMediaSelectionGroup`), differing only in media characteristic
  // (`.audible` instead of `.legible`). `AVPlayerItem.select(_:in:)` switches
  // the rendition outright and takes effect on the next few sample buffers -
  // this is a real selection, unlike the video-quality caps above.

  func getAvailableAudioTracks() throws -> [AudioTrack] {
    runOnMainThreadSync { audioTracksSnapshot() }
  }

  var selectedAudioTrackId: String? {
    // Deliberately the item's *actual* current selection rather than the
    // latched request: the selection is exact, so there is a real answer to
    // report, and under automatic selection AVFoundation still picks a concrete
    // option (system language / accessibility settings) that callers want to
    // see reflected in their menu.
    runOnMainThreadSync { currentAudioTrackId() ?? requestedAudioTrackId }
  }

  func selectAudioTrack(trackId: String?) throws {
    runOnMainThreadSync {
      requestedAudioTrackId = trackId
      // Takes effect immediately when the asset's media selection groups are
      // already loaded, which is the normal case; otherwise it is replayed by
      // `applyAudioTrackSelectionIfReady()` from the `.readyToPlay` hook in
      // HybridVideoPlayer+Events.swift.
      applyAudioTrackSelection()
      emitAudioTrackChange(force: true)
    }
  }

  /// The committed content item and its audible selection group, or nil when
  /// either does not exist yet.
  ///
  /// Prefers the library's own committed item over `player.currentItem`: during
  /// an ad break the content item may not be attached to the `AVPlayer` at all,
  /// and selecting on whatever the player happens to be holding would target
  /// the wrong item.
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
