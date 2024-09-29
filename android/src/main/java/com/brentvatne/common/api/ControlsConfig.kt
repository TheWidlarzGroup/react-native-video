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

    var seekIncrementMS: Int = 10000

    companion object {
        @JvmStatic
        fun parse(src: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (src != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(src, "hideSeekBar", false)
                config.hideDuration = ReactBridgeUtils.safeGetBool(src, "hideDuration", false)
                config.hidePosition = ReactBridgeUtils.safeGetBool(src, "hidePosition", false)
                config.hidePlayPause = ReactBridgeUtils.safeGetBool(src, "hidePlayPause", false)
                config.hideForward = ReactBridgeUtils.safeGetBool(src, "hideForward", false)
                config.hideRewind = ReactBridgeUtils.safeGetBool(src, "hideRewind", false)
                config.hideNext = ReactBridgeUtils.safeGetBool(src, "hideNext", false)
                config.hidePrevious = ReactBridgeUtils.safeGetBool(src, "hidePrevious", false)
                config.hideFullscreen = ReactBridgeUtils.safeGetBool(src, "hideFullscreen", false)
                config.seekIncrementMS = ReactBridgeUtils.safeGetInt(src, "seekIncrementMS", 10000)
                config.hideNavigationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(src, "hideNavigationBarOnFullScreenMode", true)
                config.hideNotificationBarOnFullScreenMode = ReactBridgeUtils.safeGetBool(src, "hideNotificationBarOnFullScreenMode", true)
            }
            return config
        }
    }
}
