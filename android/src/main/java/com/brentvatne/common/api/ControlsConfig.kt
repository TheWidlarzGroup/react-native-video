package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class ControlsConfig {
    var hideSeekBar: Boolean = false
    var seekIncrementMS: Int = 10000
    var hideDuration: Boolean = false
    var hideNavigationBarOnFullScreenMode: Boolean = true
    var hideNotificationBarOnFullScreenMode: Boolean = true
    var liveLabel: String? = null

    companion object {
        @JvmStatic
        fun parse(controlsConfig: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (controlsConfig != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(controlsConfig, "hideSeekBar", false)
                config.seekIncrementMS = ReactBridgeUtils.safeGetInt(controlsConfig, "seekIncrementMS", 10000)
                config.hideDuration = ReactBridgeUtils.safeGetBool(controlsConfig, "hideDuration", false)
                config.hideNavigationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(controlsConfig, "hideNavigationBarOnFullScreenMode", true)
                config.hideNotificationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(controlsConfig, "hideNotificationBarOnFullScreenMode", true)
                config.liveLabel = ReactBridgeUtils.safeGetString(controlsConfig, "liveLabel", null)
            }
            return config
        }
    }
}
