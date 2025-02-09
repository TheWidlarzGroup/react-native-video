//
//  RNVAVPlayerPlugin.swift
//  react-native-video
//

import Foundation

/**
 * Protocol for RNV plugins that have dependencies or logic that is specific to AVPlayer
 * It extends the RNVPlugin interface
 */
public protocol RNVAVPlayerPlugin: RNVPlugin {
    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return: DRMManagerSpec type if plugin wants to handle DRM, nil otherwise
     */
    func getDRMManager() -> DRMManagerSpec.Type?
}
