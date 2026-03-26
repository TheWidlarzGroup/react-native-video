import Foundation
import MediaPlayer

class NowPlayingInfoCenterManager {
  static let shared = NowPlayingInfoCenterManager()

  private let SEEK_INTERVAL_SECONDS: Double = 10

  private weak var currentPlayer: AVPlayer?
  private var players = NSHashTable<AVPlayer>.weakObjects()

  private var observers: [Int: NSKeyValueObservation] = [:]
  private var playbackObserver: Any?

  private var playTarget: Any?
  private var pauseTarget: Any?
  private var skipForwardTarget: Any?
  private var skipBackwardTarget: Any?
  private var playbackPositionTarget: Any?
  private var togglePlayPauseTarget: Any?

  private let remoteCommandCenter = MPRemoteCommandCenter.shared()

  var receivingRemoteControlEvents = false {
    didSet {
      if receivingRemoteControlEvents {
        DispatchQueue.main.async { [weak self] in
          VideoManager.shared.setRemoteControlEventsActive(true)
          UIApplication.shared.beginReceivingRemoteControlEvents()
          if self?.currentPlayer?.currentItem != nil {
            self?.updateNowPlayingInfo()
          }
        }
      } else {
        DispatchQueue.main.async {
          UIApplication.shared.endReceivingRemoteControlEvents()
          VideoManager.shared.setRemoteControlEventsActive(false)
        }
      }
    }
  }

  deinit {
    cleanup()
  }

  func registerPlayer(player: AVPlayer) {
    if players.contains(player) {
      return
    }

    if !receivingRemoteControlEvents {
      receivingRemoteControlEvents = true
    }

    if let oldObserver = observers[player.hashValue] {
      oldObserver.invalidate()
    }

    observers[player.hashValue] = observePlayers(player: player)
    players.add(player)

    // Also take over if the new player is already playing — KVO won't fire since rate hasn't changed
    if currentPlayer == nil || player.rate != 0 {
      setCurrentPlayer(player: player)
    }
  }

  func removePlayer(player: AVPlayer) {
    if !players.contains(player) {
      return
    }

    if let observer = observers[player.hashValue] {
      observer.invalidate()
    }

    observers.removeValue(forKey: player.hashValue)
    players.remove(player)

    if players.allObjects.isEmpty {
      cleanup()
      return
    }

    if currentPlayer == player {
      if let playbackObserver {
        player.removeTimeObserver(playbackObserver)
        self.playbackObserver = nil
      }
      currentPlayer = nil
      findNewCurrentPlayer()
      if currentPlayer == nil {
        updatePlaybackState()
      }
    }
  }

  public func cleanup() {
    observers.removeAll()
    players.removeAllObjects()

    if let playbackObserver {
      currentPlayer?.removeTimeObserver(playbackObserver)
      self.playbackObserver = nil
    }
    currentPlayer = nil

    invalidateCommandTargets()

    MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
    receivingRemoteControlEvents = false
  }

  private func setCurrentPlayer(player: AVPlayer) {
    if player == currentPlayer {
      return
    }

    if let playbackObserver {
      currentPlayer?.removeTimeObserver(playbackObserver)
      self.playbackObserver = nil
    }

    currentPlayer = player
    registerCommandTargets()

    updateNowPlayingInfo()
    playbackObserver = player.addPeriodicTimeObserver(
      forInterval: CMTime(value: 1, timescale: 4),
      queue: .main,
      using: { [weak self] _ in
        self?.updatePlaybackState()
      }
    )
  }

  private func registerCommandTargets() {
    invalidateCommandTargets()

    playTarget = remoteCommandCenter.playCommand.addTarget { [weak self] _ in
      guard let self, let player = self.currentPlayer else {
        return .commandFailed
      }

      if player.rate == 0 {
        player.play()
      }

      return .success
    }

    pauseTarget = remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let self, let player = self.currentPlayer else {
        return .commandFailed
      }

      if player.rate != 0 {
        player.pause()
      }

      return .success
    }

    skipBackwardTarget = remoteCommandCenter.skipBackwardCommand.addTarget {
      [weak self] _ in
      guard let self, let player = self.currentPlayer else {
        return .commandFailed
      }
      let newTime =
        player.currentTime()
        - CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
      player.seek(to: newTime)
      return .success
    }

    skipForwardTarget = remoteCommandCenter.skipForwardCommand.addTarget {
      [weak self] _ in
      guard let self, let player = self.currentPlayer else {
        return .commandFailed
      }

      let newTime =
        player.currentTime()
        + CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
      player.seek(to: newTime)
      return .success
    }

    playbackPositionTarget = remoteCommandCenter.changePlaybackPositionCommand
      .addTarget { [weak self] event in
        guard let self, let player = self.currentPlayer else {
          return .commandFailed
        }
        if let event = event as? MPChangePlaybackPositionCommandEvent {
          player.seek(
            to: CMTime(seconds: event.positionTime, preferredTimescale: .max)
          )
          return .success
        }
        return .commandFailed
      }

    // Handler for togglePlayPauseCommand, sent by Apple's Earpods wired headphones
    togglePlayPauseTarget = remoteCommandCenter.togglePlayPauseCommand.addTarget
    { [weak self] _ in
      guard let self, let player = self.currentPlayer else {
        return .commandFailed
      }

      if player.rate == 0 {
        player.play()
      } else {
        player.pause()
      }

      return .success
    }
  }

  private func invalidateCommandTargets() {
    remoteCommandCenter.playCommand.removeTarget(playTarget)
    remoteCommandCenter.pauseCommand.removeTarget(pauseTarget)
    remoteCommandCenter.skipForwardCommand.removeTarget(skipForwardTarget)
    remoteCommandCenter.skipBackwardCommand.removeTarget(skipBackwardTarget)
    remoteCommandCenter.changePlaybackPositionCommand.removeTarget(
      playbackPositionTarget
    )
    remoteCommandCenter.togglePlayPauseCommand.removeTarget(
      togglePlayPauseTarget
    )
  }

  public func updateNowPlayingInfo() {
    updateStaticInfo()
    updatePlaybackState()
  }

  func updateStaticInfo(ifCurrentItem playerItem: AVPlayerItem) {
    guard currentPlayer?.currentItem === playerItem else { return }
    updateStaticInfo()
  }

  func updateStaticInfo() {
    guard let player = currentPlayer, let currentItem = player.currentItem else {
      return
    }

    // commonMetadata is metadata from asset, externalMetadata is custom metadata set by user
    // externalMetadata should override commonMetadata to allow override metadata from source
    // When the metadata has the tag "iTunSMPB" or "iTunNORM" then the metadata is not converted correctly and comes [nil, nil, ...]
    // This leads to a crash of the app
    let metadata: [AVMetadataItem] = {
      let common = processMetadataItems(currentItem.asset.commonMetadata)
      let external = processMetadataItems(currentItem.externalMetadata)
      return Array(common.merging(external) { _, new in new }.values)
    }()

    let title = AVMetadataItem.metadataItems(
      from: metadata,
      filteredByIdentifier: .commonIdentifierTitle
    ).first?.stringValue ?? ""

    let artist = AVMetadataItem.metadataItems(
      from: metadata,
      filteredByIdentifier: .commonIdentifierArtist
    ).first?.stringValue ?? ""

    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    info[MPMediaItemPropertyTitle] = title
    info[MPMediaItemPropertyArtist] = artist
    info[MPMediaItemPropertyPlaybackDuration] = currentItem.duration.seconds
    info[MPNowPlayingInfoPropertyIsLiveStream] = CMTIME_IS_INDEFINITE(currentItem.asset.duration)
    info[MPMediaItemPropertyArtwork] = nil // Clear artwork from previous item; will be loaded asynchronously below
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info

    // Load artwork asynchronously so notification controls appear immediately.
    guard let artworkMetadataItem = AVMetadataItem.metadataItems(
      from: metadata,
      filteredByIdentifier: .commonIdentifierArtwork
    ).first else { return }

    Task { [weak self, weak player, weak currentItem] in
      guard let data = try? await artworkMetadataItem.load(.dataValue),
            let image = UIImage(data: data) else { return }
      let artworkItem = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
      await MainActor.run {
        guard let self, self.currentPlayer === player,
              self.currentPlayer?.currentItem === currentItem else { return }
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyArtwork] = artworkItem
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
      }
    }
  }

  func updatePlaybackState() {
    guard let player = currentPlayer else {
      invalidateCommandTargets()
      MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
      return
    }

    guard let currentItem = player.currentItem else { return }

    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentItem.currentTime().seconds
    info[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
    info[MPMediaItemPropertyPlaybackDuration] = currentItem.duration.seconds
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  private func findNewCurrentPlayer() {
    if let newPlayer = players.allObjects.first(where: {
      $0.rate != 0
    }) {
      setCurrentPlayer(player: newPlayer)
    }
  }

  // We will observe players rate to find last active player that info will be displayed
  private func observePlayers(player: AVPlayer) -> NSKeyValueObservation {
    return player.observe(\.rate) { [weak self] player, _ in
      guard let self else { return }

      let rate = player.rate

      // case where there is new player that is not paused
      // In this case event is triggered by non currentPlayer
      if rate != 0 && self.currentPlayer != player {
        self.setCurrentPlayer(player: player)
        return
      }

      // case where currentPlayer was paused
      // In this case event is triggered by currentPlayer
      if rate == 0 && self.currentPlayer == player {
        self.findNewCurrentPlayer()
      }
    }
  }

  private func processMetadataItems(_ items: [AVMetadataItem]) -> [String:
    AVMetadataItem]
  {
    var result = [String: AVMetadataItem]()

    for item in items {
      if let id = item.identifier?.rawValue, !id.isEmpty, result[id] == nil {
        result[id] = item
      }
    }

    return result
  }
}
