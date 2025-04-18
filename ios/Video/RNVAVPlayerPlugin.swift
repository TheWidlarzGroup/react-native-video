//
//  RNVAVPlayerPlugin.swift
//  react-native-video
//

import AVFoundation
import Foundation

/**
 * class for RNV plugins that have dependencies or logic that is specific to AVPlayer
 * It extends the RNVPlugin interface
 */
open class RNVAVPlayerPlugin: RNVPlugin {
    // MARK: - Definitions

    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return: DRMManagerSpec type if plugin wants to handle DRM, nil otherwise
     */
    open func getDRMManager() -> DRMManagerSpec? { nil }

    /**
     * Function called when a new AVPlayer instance is created
     * @param id: a random string identifying the player
     * @param player: the instantiated AVPlayer
     * @note: This is helper that ensure that player is non null AVPlayer
     */
    open func onInstanceCreated(id _: String, player _: AVPlayer) { /* no-op */ }

    /**
     * Function called when a AVPlayer instance is being removed
     * @param id: a random string identifying the player
     * @param player: the AVPlayer to release
     * @note: This is helper that ensure that player is non null AVPlayer
     */
    open func onInstanceRemoved(id _: String, player _: AVPlayer) { /* no-op */ }

    /**
     * Function called when creating a new AVPlayerItem
     * @param source: The VideoSource describing the video (uri, type, headers, etc.)
     * @param asset: The AVAsset prepared by the player
     * @return: OverridePlayerAssetResult if you want to override, or nil if you don't
     */
    open func overridePlayerAsset(source _: VideoSource, asset _: AVAsset) async -> OverridePlayerAssetResult? { nil }

    // MARK: - RNVPlugin methods

    override public func onInstanceCreated(id: String, player: Any) {
        if let avPlayer = player as? AVPlayer {
            onInstanceCreated(id: id, player: avPlayer)
        }
    }

    override public func onInstanceRemoved(id: String, player: Any) {
        if let avPlayer = player as? AVPlayer {
            onInstanceRemoved(id: id, player: avPlayer)
        }
    }
}
