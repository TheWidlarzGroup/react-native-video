package com.brentvatne.common.api

import androidx.media3.exoplayer.upstream.CmcdConfiguration
import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetInt
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

class CMCDProps {
    var cmcdObject: Array<Pair<String, Any>> = emptyArray()
    var cmcdRequest: Array<Pair<String, Any>> = emptyArray()
    var cmcdSession: Array<Pair<String, Any>> = emptyArray()
    var cmcdStatus: Array<Pair<String, Any>> = emptyArray()
    var mode: Int = CmcdConfiguration.MODE_QUERY_PARAMETER

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as CMCDProps

        if (!cmcdObject.contentDeepEquals(other.cmcdObject)) return false
        if (!cmcdRequest.contentDeepEquals(other.cmcdRequest)) return false
        if (!cmcdSession.contentDeepEquals(other.cmcdSession)) return false
        if (!cmcdStatus.contentDeepEquals(other.cmcdStatus)) return false
        if (mode != other.mode) return false

        return true
    }

    override fun hashCode(): Int {
        var result = cmcdObject.contentHashCode()
        result = 31 * result + cmcdRequest.contentHashCode()
        result = 31 * result + cmcdSession.contentHashCode()
        result = 31 * result + cmcdStatus.contentHashCode()
        result = 31 * result + mode
        return result
    }

    companion object {
        private const val PROP_CMCD_OBJECT = "object"
        private const val PROP_CMCD_REQUEST = "request"
        private const val PROP_CMCD_SESSION = "session"
        private const val PROP_CMCD_STATUS = "status"
        private const val PROP_CMCD_MODE = "mode"

        @JvmStatic
        fun parse(src: ReadableMap?): CMCDProps? {
            if (src == null) return null

            val cmcdProps = CMCDProps()
            cmcdProps.cmcdObject = parseKeyValuePairs(src.getArray(PROP_CMCD_OBJECT))
            cmcdProps.cmcdRequest = parseKeyValuePairs(src.getArray(PROP_CMCD_REQUEST))
            cmcdProps.cmcdSession = parseKeyValuePairs(src.getArray(PROP_CMCD_SESSION))
            cmcdProps.cmcdStatus = parseKeyValuePairs(src.getArray(PROP_CMCD_STATUS))
            cmcdProps.mode = safeGetInt(src, PROP_CMCD_MODE, CmcdConfiguration.MODE_QUERY_PARAMETER)

            return cmcdProps
        }

        private fun parseKeyValuePairs(array: ReadableArray?): Array<Pair<String, Any>> {
            if (array == null) return emptyArray()

            return (0 until array.size()).mapNotNull { i ->
                val item = array.getMap(i)
                val key = item?.getString("key")
                val value = when (item?.getType("value")) {
                    ReadableType.Number -> item.getDouble("value")
                    ReadableType.String -> item.getString("value")
                    else -> null
                }

                if (key != null && value != null) Pair(key, value) else null
            }.toTypedArray()
        }
    }
}
