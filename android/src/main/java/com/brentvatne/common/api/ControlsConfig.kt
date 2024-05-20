package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class ControlsConfig {
    var hideSeekBar: Boolean = false

    companion object {
        @JvmStatic
        fun parse(src: ReadableMap?): ControlsConfig {
            val config = ControlsConfig()

            if (src != null) {
                config.hideSeekBar = ReactBridgeUtils.safeGetBool(src, "hideSeekBar", false)
            }

            return config
        }
    }
}
