import Foundation
import MediaPlayer

class NowPlayingInfoCenterManager {
  static let shared = NowPlayingInfoCenterManager()

  private let SEEK_INTERVAL_SECONDS: Double = 10

  private weak var currentPlayer: AVPlayer?
  private let players = NSHashTable<AVPlayer>.weakObjects()

  private var observers: [Int: NSKeyValueObservation] = [:]
  private var playbackObserver: Any?

  private var playTarget: Any?
  private var pauseTarget: Any?
  private var skipForwardTarget: Any?
  private var skipBackwardTarget: Any?
  private var playbackPositionTarget: Any?
  private var togglePlayPauseTarget: Any?

  private lazy var remoteCommandCenter = MPRemoteCommandCenter.shared()

  private var receivingRemoteControlEvents = false {
    didSet {
      if receivingRemoteControlEvents {
        UIApplication.shared.beginReceivingRemoteControlEvents()
        VideoManager.shared.setRemoteControlEventsActive(true)
        if currentPlayer?.currentItem != nil {
          updateNowPlayingInfo()
        }
      } else {
        UIApplication.shared.endReceivingRemoteControlEvents()
        VideoManager.shared.setRemoteControlEventsActive(false)
      }
    }
  }

  func registerPlayer(player: AVPlayer) {
    runOnMainThread { [weak self, player] in
      guard let self, !self.players.contains(player) else { return }

      if !self.receivingRemoteControlEvents {
        self.receivingRemoteControlEvents = true
      }

      let newObserver = self.observePlayers(player: player)
      let oldObserver = self.observers[player.hashValue]
      self.observers[player.hashValue] = newObserver
      oldObserver?.invalidate()

      self.players.add(player)

      // Also take over if the new player is already playing — KVO won't fire since rate hasn't changed
      if self.currentPlayer == nil || player.rate != 0 {
        self.setCurrentPlayer(player: player)
      }
    }
  }

  func removePlayer(player: AVPlayer) {
    runOnMainThread { [weak self, player] in
      guard let self else { return }

      guard self.players.contains(player) else { return }

      self.players.remove(player)
      let noPlayersLeft = self.players.allObjects.isEmpty

      if noPlayersLeft {
        self.cleanup()
        return
      }

      let observer = self.observers.removeValue(forKey: player.hashValue)
      observer?.invalidate()

      if self.currentPlayer == player {
        if let playbackObserver = self.playbackObserver {
          player.removeTimeObserver(playbackObserver)
          self.playbackObserver = nil
        }
        self.currentPlayer = nil
        self.findNewCurrentPlayer()
        if self.currentPlayer == nil {
          self.updatePlaybackState()
        }
      }
    }
  }

  private func cleanup() {
    let staleObservers = observers
    observers.removeAll()
    staleObservers.values.forEach { $0.invalidate() }
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
      return runOnMainThreadSync {
        guard let player = self?.currentPlayer, player.rate == 0 else {
          return .commandFailed
        }

        player.play()
        return .success
      }
    }

    pauseTarget = remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      return runOnMainThreadSync {
        guard let player = self?.currentPlayer, player.rate != 0 else {
          return .commandFailed
        }

        player.pause()
        VideoManager.shared.clearBackgroundResumeIntent(for: player)
        return .success
      }
    }

    skipBackwardTarget = remoteCommandCenter.skipBackwardCommand.addTarget {
      [weak self] _ in
      return runOnMainThreadSync {
        guard let self, let player = self.currentPlayer else {
          return .commandFailed
        }
        let newTime =
          player.currentTime()
          - CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
        player.seek(to: newTime)
        return .success
      }
    }

    skipForwardTarget = remoteCommandCenter.skipForwardCommand.addTarget {
      [weak self] _ in
      return runOnMainThreadSync {
        guard let self, let player = self.currentPlayer else {
          return .commandFailed
        }
        let newTime =
          player.currentTime()
          + CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
        player.seek(to: newTime)
        return .success
      }
    }

    playbackPositionTarget = remoteCommandCenter.changePlaybackPositionCommand
      .addTarget { [weak self] event in
        return runOnMainThreadSync {
          guard let player = self?.currentPlayer,
                let event = event as? MPChangePlaybackPositionCommandEvent else {
            return .commandFailed
          }
          player.seek(
            to: CMTime(seconds: event.positionTime, preferredTimescale: .max)
          )
          return .success
        }
      }

    // Handler for togglePlayPauseCommand, sent by Apple's Earpods wired headphones
    togglePlayPauseTarget = remoteCommandCenter.togglePlayPauseCommand.addTarget
    { [weak self] _ in
      return runOnMainThreadSync {
        guard let player = self?.currentPlayer else {
          return .commandFailed
        }

        if player.rate == 0 {
          player.play()
        } else {
          player.pause()
          VideoManager.shared.clearBackgroundResumeIntent(for: player)
        }
        return .success
      }
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

  func updateStaticInfo(ifCurrentItem playerItem: AVPlayerItem) {
    runOnMainThread { [weak self, weak playerItem] in
      guard let self, let playerItem,
            self.currentPlayer?.currentItem === playerItem else { return }
      self.updateStaticInfo()
    }
  }

  private func updateNowPlayingInfo() {
    updateStaticInfo()
    updatePlaybackState()
  }

  private func updateStaticInfo() {
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
    runOnMainThread { [weak self] in
      guard let self else { return }
      guard let player = self.currentPlayer else {
        self.invalidateCommandTargets()
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
      DispatchQueue.main.async { [weak self, weak player] in
        guard let self, let player, self.players.contains(player) else { return }

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
