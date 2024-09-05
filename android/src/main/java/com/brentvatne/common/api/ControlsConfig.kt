package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class ControlsConfig {
    var hideSeekBar: Boolean = false
    var seekIncrementMS: Int = 10000
    var hideDuration: Boolean = false
    var hideNavigationBarOnFullScreenMode: Boolean = true
    var hideNotificationBarOnFullScreenMode: Boolean = true

    companion object {
        @JvmStatic
        fun parse(src: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (src != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(src, "hideSeekBar", false)
                config.seekIncrementMS = ReactBridgeUtils.safeGetInt(src, "seekIncrementMS", 10000)
                config.hideDuration = ReactBridgeUtils.safeGetBool(src, "hideDuration", false)
                config.hideNavigationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(src, "hideNavigationBarOnFullScreenMode", true)
                config.hideNotificationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(src, "hideNotificationBarOnFullScreenMode", true)
            }
            return config
        }
    }
}
