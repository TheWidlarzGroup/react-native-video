package com.brentvatne.react

import com.brentvatne.exoplayer.DRMManagerSpec

/**
 * Interface for RNV plugins that have dependencies or logic that is specific to Exoplayer
 * It extends the RNVPlugin interface
 */
interface RNVExoplayerPlugin : RNVPlugin {
    /**
     * Optional function that allows plugin to provide custom DRM manager
     * Only one plugin can provide DRM manager at a time
     * @return DRMManagerSpec implementation if plugin wants to handle DRM, null otherwise
     */
    fun getDRMManager(): DRMManagerSpec?
}
