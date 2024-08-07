package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class ControlsConfig {
    var hideSeekBar: Boolean = false
    var seekIncrementMS: Int = 10000
    var hideNavigationBarOnFullScreenMode: Boolean = false

    companion object {
        @JvmStatic
        fun parse(src: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (src != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(src, "hideSeekBar", false)
                config.seekIncrementMS = ReactBridgeUtils.safeGetInt(src, "seekIncrementMS", 10000)
                config.hideNavigationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(src, "hideNavigationBarOnFullScreenMode", false)
            }
            return config
        }
    }
}
