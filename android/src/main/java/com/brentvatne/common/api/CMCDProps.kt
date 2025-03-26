package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetInt
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

data class CMCDProps(
    val cmcdObject: List<Pair<String, Any>> = emptyList(),
    val cmcdRequest: List<Pair<String, Any>> = emptyList(),
    val cmcdSession: List<Pair<String, Any>> = emptyList(),
    val cmcdStatus: List<Pair<String, Any>> = emptyList(),
    val mode: Int = 1
) {
    companion object {
        private const val PROP_CMCD_OBJECT = "object"
        private const val PROP_CMCD_REQUEST = "request"
        private const val PROP_CMCD_SESSION = "session"
        private const val PROP_CMCD_STATUS = "status"
        private const val PROP_CMCD_MODE = "mode"

        @JvmStatic
        fun parse(src: ReadableMap?): CMCDProps? {
            if (src == null) return null

            return CMCDProps(
                cmcdObject = parseKeyValuePairs(src.getArray(PROP_CMCD_OBJECT)),
                cmcdRequest = parseKeyValuePairs(src.getArray(PROP_CMCD_REQUEST)),
                cmcdSession = parseKeyValuePairs(src.getArray(PROP_CMCD_SESSION)),
                cmcdStatus = parseKeyValuePairs(src.getArray(PROP_CMCD_STATUS)),
                mode = safeGetInt(src, PROP_CMCD_MODE, 1)
            )
        }

        private fun parseKeyValuePairs(array: ReadableArray?): List<Pair<String, Any>> {
            if (array == null) return emptyList()

            return (0 until array.size()).mapNotNull { i ->
                val item = array.getMap(i)
                val key = item?.getString("key")
                val value = when (item?.getType("value")) {
                    ReadableType.Number -> item?.getDouble("value")
                    ReadableType.String -> item?.getString("value")
                    else -> null
                }

                if (key != null && value != null) Pair(key, value) else null
            }
        }
    }
}
