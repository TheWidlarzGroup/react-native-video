package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

/**
 * Helper file to parse SubtitleStyle prop and build a dedicated class
 */
class SubtitleStyle private constructor() {
    var fontSize = -1
        private set
    var paddingLeft = 0
        private set
    var paddingRight = 0
        private set
    var paddingTop = 0
        private set
    var paddingBottom = 0
        private set
    var opacity = 1f
        private set

    companion object {
        private const val PROP_FONT_SIZE_TRACK = "fontSize"
        private const val PROP_PADDING_BOTTOM = "paddingBottom"
        private const val PROP_PADDING_TOP = "paddingTop"
        private const val PROP_PADDING_LEFT = "paddingLeft"
        private const val PROP_PADDING_RIGHT = "paddingRight"
        private const val PROP_OPACITY = "opacity"

        @JvmStatic
        fun parse(src: ReadableMap?): SubtitleStyle {
            val subtitleStyle = SubtitleStyle()
            subtitleStyle.fontSize = ReactBridgeUtils.safeGetInt(src, PROP_FONT_SIZE_TRACK, -1)
            subtitleStyle.paddingBottom = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_BOTTOM, 0)
            subtitleStyle.paddingTop = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_TOP, 0)
            subtitleStyle.paddingLeft = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_LEFT, 0)
            subtitleStyle.paddingRight = ReactBridgeUtils.safeGetInt(src, PROP_PADDING_RIGHT, 0)
            subtitleStyle.opacity = ReactBridgeUtils.safeGetFloat(src, PROP_OPACITY, 1f)
            return subtitleStyle
        }
    }
}
