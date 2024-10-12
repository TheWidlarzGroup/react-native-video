package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class ControlsConfig {
    var hideSeekBar: Boolean = false
    var hideDuration: Boolean = false
    var hidePosition: Boolean = false
    var hidePlayPause: Boolean = false
    var hideForward: Boolean = false
    var hideRewind: Boolean = false
    var hideNext: Boolean = false
    var hidePrevious: Boolean = false
    var hideFullscreen: Boolean = false
    var hideNavigationBarOnFullScreenMode: Boolean = true
    var hideNotificationBarOnFullScreenMode: Boolean = true
    var liveLabel: String? = null
    var hideSettingButton: Boolean = true

    var seekIncrementMS: Int = 10000

    companion object {
        @JvmStatic
        fun parse(controlsConfig: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (controlsConfig != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(controlsConfig, "hideSeekBar", false)
                config.hideDuration = ReactBridgeUtils.safeGetBool(controlsConfig, "hideDuration", false)
                config.hidePosition = ReactBridgeUtils.safeGetBool(controlsConfig, "hidePosition", false)
                config.hidePlayPause = ReactBridgeUtils.safeGetBool(controlsConfig, "hidePlayPause", false)
                config.hideForward = ReactBridgeUtils.safeGetBool(controlsConfig, "hideForward", false)
                config.hideRewind = ReactBridgeUtils.safeGetBool(controlsConfig, "hideRewind", false)
                config.hideNext = ReactBridgeUtils.safeGetBool(controlsConfig, "hideNext", false)
                config.hidePrevious = ReactBridgeUtils.safeGetBool(controlsConfig, "hidePrevious", false)
                config.hideFullscreen = ReactBridgeUtils.safeGetBool(controlsConfig, "hideFullscreen", false)
                config.seekIncrementMS = ReactBridgeUtils.safeGetInt(controlsConfig, "seekIncrementMS", 10000)
                config.hideNavigationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(controlsConfig, "hideNavigationBarOnFullScreenMode", true)
                config.hideNotificationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(controlsConfig, "hideNotificationBarOnFullScreenMode", true)
                config.liveLabel = ReactBridgeUtils.safeGetString(controlsConfig, "liveLabel", null)
                config.hideSettingButton = ReactBridgeUtils.safeGetBool(controlsConfig, "hideSettingButton", true)
            }
            return config
        }
    }
}
