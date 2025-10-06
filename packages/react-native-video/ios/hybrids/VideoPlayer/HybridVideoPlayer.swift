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

  var playerItem: AVPlayerItem? {
    didSet {
      if let bufferConfig = source.config.bufferConfig {
        playerItem?.setBufferConfig(config: bufferConfig)
      }
    }
  }
  var playerObserver: VideoPlayerObserver?

  init(source: (any HybridVideoPlayerSourceSpec)) throws {
    self.source = source
    self.eventEmitter = HybridVideoPlayerEventEmitter()
    
    // Initialize AVPlayer with empty item
    self.player = AVPlayer()

    super.init()
    self.playerObserver = VideoPlayerObserver(delegate: self)
    self.playerObserver?.initializePlayerObservers()
    
    Task {
      if source.config.initializeOnCreation == true {
        self.playerItem = try await initializePlayerItem()
        self.player.replaceCurrentItem(with: self.playerItem)
      }
    }

    VideoManager.shared.register(player: self)
  }

  deinit {
    release()
  }

  // MARK: - Hybrid Impl

  var source: any HybridVideoPlayerSourceSpec

  var status: VideoPlayerStatus = .idle {
    didSet {
      if status != oldValue {
        eventEmitter.onStatusChange(status)
      }
    }
  }

  var eventEmitter: HybridVideoPlayerEventEmitterSpec

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
      eventEmitter.onVolumeChange(
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
      eventEmitter.onSeek(newValue)
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

  var wasAutoPaused: Bool = false

  // Text track selection state
  private var selectedExternalTrackIndex: Int? = nil

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
    return Promise.async { [weak self] in
      guard let self else {
        throw LibraryError.deallocated(objectName: "HybridVideoPlayer").error()
      }
      
      if self.playerItem != nil {
        return
      }
      
      self.playerItem = try await self.initializePlayerItem()
      self.player.replaceCurrentItem(with: self.playerItem)
    }
  }

  func release() {
    NowPlayingInfoCenterManager.shared.removePlayer(player: player)
    self.player.replaceCurrentItem(with: nil)
    self.playerItem = nil

    if let source = self.source as? HybridVideoPlayerSource {
      source.releaseAsset()
    }

    // Clear player observer
    self.playerObserver = nil
    status = .idle

    VideoManager.shared.unregister(player: self)
  }

  func preload() throws -> NitroModules.Promise<Void> {
    let promise = Promise<Void>()

    if status != .idle {
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
        let playerItem = try await self.initializePlayerItem()
        self.playerItem = playerItem

        self.player.replaceCurrentItem(with: playerItem)
        promise.resolve(withResult: ())
      } catch {
        promise.reject(withError: error)
      }
    }

    return promise
  }

  func play() throws {
    player.play()
  }

  func pause() throws {
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

  func replaceSourceAsync(source: (any HybridVideoPlayerSourceSpec)?) throws
    -> Promise<Void>
  {
    let promise = Promise<Void>()

    guard let source else {
      release()
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

      self.source = source
      self.playerItem = try await self.initializePlayerItem()
      self.player.replaceCurrentItem(with: self.playerItem)
      NowPlayingInfoCenterManager.shared.updateNowPlayingInfo()
      promise.resolve(withResult: ())
    }

    return promise
  }

  // MARK: - Methods

  func initializePlayerItem() async throws -> AVPlayerItem {
    // Ensure the source is a valid HybridVideoPlayerSource
    guard let _hybridSource = source as? HybridVideoPlayerSource else {
      status = .error
      throw PlayerError.invalidSource.error()
    }

    // (maybe) Override source with plugins
    let _source = await PluginsRegistry.shared.overrideSource(
      source: _hybridSource
    )

    let isNetworkSource = _source.url.isFileURL == false
    eventEmitter.onLoadStart(
      .init(sourceType: isNetworkSource ? .network : .local, source: _source)
    )

    let asset = try await _source.getAsset()

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

  func selectTextTrack(textTrack: TextTrack?) throws {
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
      eventEmitter.onTrackChange(nil)
      return
    }

    // If textTrack id is empty, deselect any selected track
    if textTrack.id.isEmpty {
      currentItem.select(nil, in: mediaSelection)
      selectedExternalTrackIndex = nil
      eventEmitter.onTrackChange(nil)
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
        eventEmitter.onTrackChange(textTrack)
      }
    } else if textTrack.id.hasPrefix("builtin-") {
      for option in mediaSelection.options {
        let optionId =
          "builtin-\(option.displayName)-\(option.locale?.identifier ?? "unknown")"
        if optionId == textTrack.id {
          currentItem.select(option, in: mediaSelection)
          selectedExternalTrackIndex = nil
          eventEmitter.onTrackChange(textTrack)
          return
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
    var size = 0

    size += source.memorySize
    size += playerItem?.asset.estimatedMemoryUsage ?? 0

    return size
  }
}
