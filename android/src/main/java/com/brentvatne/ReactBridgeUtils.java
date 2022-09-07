package com.brentvatne;

import com.facebook.react.bridge.ReadableMap;

/*
* This file define static helpers to parse in an easier way input props
 */
public class ReactBridgeUtils {
    /*
    retrieve key from map as int. fallback is returned if not available
     */
    static public int safeGetInt(ReadableMap map, String key, int fallback) {
        return map != null && map.hasKey(key) && !map.isNull(key) ? map.getInt(key) : fallback;
    }

    /*
    retrieve key from map as double. fallback is returned if not available
     */
    static public double safeGetDouble(ReadableMap map, String key, double fallback) {
        return map != null && map.hasKey(key) && !map.isNull(key) ? map.getDouble(key) : fallback;
    }
}
