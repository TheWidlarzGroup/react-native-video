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
    private var seekTarget: Any?
    private var togglePlayPauseTarget: Any?

    private let remoteCommandCenter = MPRemoteCommandCenter.shared()

    var receivingRemoveControlEvents = false {
        didSet {
            if receivingRemoveControlEvents {
                AudioSessionManager.shared.setRemoteControlEventsActive(true)
                UIApplication.shared.beginReceivingRemoteControlEvents()
            } else {
                UIApplication.shared.endReceivingRemoteControlEvents()
                AudioSessionManager.shared.setRemoteControlEventsActive(false)
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

        if receivingRemoveControlEvents == false {
            receivingRemoveControlEvents = true
        }

        if let oldObserver = observers[player.hashValue] {
            oldObserver.invalidate()
        }

        observers[player.hashValue] = observePlayers(player: player)
        players.add(player)

        if currentPlayer == nil {
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

        if currentPlayer == player {
            currentPlayer = nil
            updateNowPlayingInfo()
        }

        if players.allObjects.isEmpty {
            cleanup()
        }
    }

    public func cleanup() {
        observers.removeAll()
        players.removeAllObjects()

        if let playbackObserver {
            currentPlayer?.removeTimeObserver(playbackObserver)
        }

        invalidateCommandTargets()

        MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
        receivingRemoveControlEvents = false
    }

    private func setCurrentPlayer(player: AVPlayer) {
        if player == currentPlayer {
            return
        }

        if let playbackObserver {
            currentPlayer?.removeTimeObserver(playbackObserver)
        }

        currentPlayer = player
        registerCommandTargets()

        updateNowPlayingInfo()
        playbackObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(value: 1, timescale: 4),
            queue: .global(),
            using: { [weak self] _ in
                self?.updateNowPlayingInfo()
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

        skipBackwardTarget = remoteCommandCenter.skipBackwardCommand.addTarget { [weak self] _ in
            guard let self, let player = self.currentPlayer else {
                return .commandFailed
            }
            let newTime = player.currentTime() - CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
            player.seek(to: newTime)
            return .success
        }

        skipForwardTarget = remoteCommandCenter.skipForwardCommand.addTarget { [weak self] _ in
            guard let self, let player = self.currentPlayer else {
                return .commandFailed
            }

            let newTime = player.currentTime() + CMTime(seconds: self.SEEK_INTERVAL_SECONDS, preferredTimescale: .max)
            player.seek(to: newTime)
            return .success
        }

        playbackPositionTarget = remoteCommandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self, let player = self.currentPlayer else {
                return .commandFailed
            }
            if let event = event as? MPChangePlaybackPositionCommandEvent {
                player.seek(to: CMTime(seconds: event.positionTime, preferredTimescale: .max))
                return .success
            }
            return .commandFailed
        }

        // Handler for togglePlayPauseCommand, sent by Apple's Earpods wired headphones
        togglePlayPauseTarget = remoteCommandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
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
        remoteCommandCenter.changePlaybackPositionCommand.removeTarget(playbackPositionTarget)
        remoteCommandCenter.togglePlayPauseCommand.removeTarget(togglePlayPauseTarget)
    }

    public func updateNowPlayingInfo() {
        guard let player = currentPlayer, let currentItem = player.currentItem else {
            invalidateCommandTargets()
            MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
            return
        }

        // commonMetadata is metadata from asset, externalMetadata is custom metadata set by user
        // externalMetadata should override commonMetadata to allow override metadata from source
        // When the metadata has the tag "iTunSMPB" or "iTunNORM" then the metadata is not converted correctly and comes [nil, nil, ...]
        // This leads to a crash of the app
        let metadata: [AVMetadataItem] = {
            func processMetadataItems(_ items: [AVMetadataItem]) -> [String: AVMetadataItem] {
                var result = [String: AVMetadataItem]()

                for item in items {
                    if let id = item.identifier?.rawValue, !id.isEmpty, result[id] == nil {
                        result[id] = item
                    }
                }

                return result
            }

            let common = processMetadataItems(currentItem.asset.commonMetadata)
            let external = processMetadataItems(currentItem.externalMetadata)

            return Array(common.merging(external) { _, new in new }.values)
        }()

        let titleItem = AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierTitle).first?.stringValue ?? ""

        let artistItem = AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierArtist).first?.stringValue ?? ""

        // I have some issue with this - setting artworkItem when it not set dont return nil but also is crashing application
        // this is very hacky workaround for it
        let imgData = AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierArtwork).first?.dataValue
        let image = imgData.flatMap { UIImage(data: $0) } ?? UIImage()
        let artworkItem = MPMediaItemArtwork(boundsSize: image.size) { _ in image }

        let newNowPlayingInfo: [String: Any] = [
            MPMediaItemPropertyTitle: titleItem,
            MPMediaItemPropertyArtist: artistItem,
            MPMediaItemPropertyArtwork: artworkItem,
            MPMediaItemPropertyPlaybackDuration: currentItem.duration.seconds,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentItem.currentTime().seconds.rounded(),
            MPNowPlayingInfoPropertyPlaybackRate: player.rate,
            MPNowPlayingInfoPropertyIsLiveStream: CMTIME_IS_INDEFINITE(currentItem.asset.duration),
        ]
        let currentNowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

        MPNowPlayingInfoCenter.default().nowPlayingInfo = currentNowPlayingInfo.merging(newNowPlayingInfo) { _, new in new }
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
        return player.observe(\.rate) { [weak self] player, change in
            guard let self else { return }

            let rate = change.newValue

            // case where there is new player that is not paused
            // In this case event is triggered by non currentPlayer
            if rate != 0 && self.currentPlayer != player {
                self.setCurrentPlayer(player: player)
                return
            }

            // case where currentPlayer was paused
            // In this case event is triggeret by currentPlayer
            if rate == 0 && self.currentPlayer == player {
                self.findNewCurrentPlayer()
            }
        }
    }
}
