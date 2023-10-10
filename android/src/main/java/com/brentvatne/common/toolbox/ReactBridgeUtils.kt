package com.brentvatne.common.toolbox

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import java.util.HashMap

/*
* Toolbox to safe parsing of <Video props
* These are just safe accessors to ReadableMap
*/

object ReactBridgeUtils {
    @JvmStatic
    fun safeGetString(map: ReadableMap?, key: String?, fallback: String?): String? {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getString(key) else fallback
    }

    @JvmStatic
    fun safeGetString(map: ReadableMap?, key: String?): String? {
        return safeGetString(map, key, null)
    }

    @JvmStatic
    fun safeGetDynamic(map: ReadableMap?, key: String?, fallback: Dynamic?): Dynamic? {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getDynamic(key) else fallback
    }

    @JvmStatic
    fun safeGetDynamic(map: ReadableMap?, key: String?): Dynamic? {
        return safeGetDynamic(map, key, null)
    }

    @JvmStatic
    fun safeGetBool(map: ReadableMap?, key: String?, fallback: Boolean): Boolean {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getBoolean(key) else fallback
    }

    @JvmStatic
    fun safeGetMap(map: ReadableMap?, key: String?): ReadableMap? {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getMap(key) else null
    }

    @JvmStatic
    fun safeGetArray(map: ReadableMap?, key: String?): ReadableArray? {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getArray(key) else null
    }

    @JvmStatic
    fun safeGetInt(map: ReadableMap?, key: String?, fallback: Int): Int {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getInt(key) else fallback
    }

    @JvmStatic
    fun safeGetInt(map: ReadableMap?, key: String?): Int {
        return safeGetInt(map, key, 0);
    }

    @JvmStatic
    fun safeGetDouble(map: ReadableMap?, key: String?, fallback: Double): Double {
        return if (map != null && map.hasKey(key!!) && !map.isNull(key)) map.getDouble(key) else fallback
    }
    @JvmStatic
    fun safeGetDouble(map: ReadableMap?, key: String?): Double {
        return safeGetDouble(map, key, 0.0);
    }
    /**
     * toStringMap converts a [ReadableMap] into a HashMap.
     *
     * @param readableMap The ReadableMap to be conveted.
     * @return A HashMap containing the data that was in the ReadableMap.
     * @see 'Adapted from https://github.com/artemyarulin/react-native-eval/blob/master/android/src/main/java/com/evaluator/react/ConversionUtil.java'
     */
    @JvmStatic
    fun toStringMap(readableMap: ReadableMap?): Map<String, String?>? {
        if (readableMap == null) return null
        val iterator = readableMap.keySetIterator()
        if (!iterator.hasNextKey()) return null
        val result: MutableMap<String, String?> = HashMap()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            result[key] = readableMap.getString(key)
        }
        return result
    }

    /**
     * toIntMap converts a [ReadableMap] into a HashMap.
     *
     * @param readableMap The ReadableMap to be conveted.
     * @return A HashMap containing the data that was in the ReadableMap.
     * @see 'Adapted from https://github.com/artemyarulin/react-native-eval/blob/master/android/src/main/java/com/evaluator/react/ConversionUtil.java'
     */
    @JvmStatic
    fun toIntMap(readableMap: ReadableMap?): Map<String, Int>? {
        if (readableMap == null) return null
        val iterator = readableMap.keySetIterator()
        if (!iterator.hasNextKey()) return null
        val result: MutableMap<String, Int> = HashMap()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            result[key] = readableMap.getInt(key)
        }
        return result
    }

    @JvmStatic
    fun safeStringEquals(str1: String?, str2: String?): Boolean {
        if (str1 == null && str2 == null) return true // both are null
        return if (str1 == null || str2 == null) false else str1 == str2 // only 1 is null
    }

    @JvmStatic
    fun safeStringArrayEquals(str1: Array<String>?, str2: Array<String>?): Boolean {
        if (str1 == null && str2 == null) return true // both are null
        if (str1 == null || str2 == null) return false // only 1 is null
        if (str1.size != str2.size) return false // only 1 is null
        for (i in str1.indices) {
            if (str1[i] == str2[i]) // standard check
                return false
        }
        return true
    }

    @JvmStatic
    fun safeStringMapEquals(
        first: Map<String?, String?>?,
        second: Map<String?, String?>?
    ): Boolean {
        if (first == null && second == null) return true // both are null
        if (first == null || second == null) return false // only 1 is null
        if (first.size != second.size) {
            return false
        }
        for (key in first.keys) {
            if (!safeStringEquals(first[key], second[key])) {
                return false
            }
        }
        return true
    }
}
