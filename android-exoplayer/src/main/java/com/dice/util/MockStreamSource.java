package com.dice.util;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.endeavor.WebUtil;

public class MockStreamSource {

    public static void logRNParam(int pos, String name, ReadableType type, Object param) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < pos; i++) {
            builder.append(" ");
        }
        builder.append(type).append(" : ");
        builder.append(name).append(" : ");
        boolean isMap = type == ReadableType.Map;
        boolean isArr = type == ReadableType.Array;
        if (!isMap && !isArr) {
            builder.append(param);
        }
        Log.d(WebUtil.DEBUG, builder.toString());

        // Children
        int childPos = pos + 4;
        if (isMap) {
            ReadableMap parent = (ReadableMap) param;
            ReadableMapKeySetIterator iter = parent.keySetIterator();
            while (iter.hasNextKey()) {
                String childName = iter.nextKey();
                ReadableType childType = parent.getType(childName);
                logRNParam(childPos, childName, childType, castRNValue(childType, parent.getDynamic(childName)));
            }
        } else if (isArr) {
            ReadableArray parent = (ReadableArray) param;
            for (int i = 0; i < parent.size(); i++) {
                ReadableType childType = parent.getType(i);
                logRNParam(childPos, "", childType, castRNValue(childType, parent.getDynamic(i)));
            }
        }
    }

    private static Object castRNValue(ReadableType type, Dynamic param) {
        if (type == ReadableType.Null) {
            return null;
        } else if (type == ReadableType.Map) {
            return param.asMap();
        } else if (type == ReadableType.Array) {
            return param.asArray();
        } else if (type == ReadableType.String) {
            return param.asString();
        } else if (type == ReadableType.Number) {
            return param.asDouble();
        } else if (type == ReadableType.Boolean) {
            return param.asBoolean();
        }
        return null;
    }

    public static ReadableMap getMockTvStream() {
        WritableMap src = Arguments.createMap();

        WritableMap ima = Arguments.createMap();
        int startDate = (int) (System.currentTimeMillis() / 1000);
        int endDate = startDate + 6000;
        WritableMap adTagParameters = Arguments.createMap();
        adTagParameters.putString("an", "prendetv");
        adTagParameters.putString("output", "xml_vast4");
        adTagParameters.putString("description_url", "https://univision.diceplatform.com/live/182788/test-vll-drm--ssai-big-buck-bunny");
        adTagParameters.putString("url", "https://univision.diceplatform.com/live/182788/test-vll-drm--ssai-big-buck-bunny");
        adTagParameters.putString("vpa", "2");
        adTagParameters.putString("iu", "/6881/prendetv/live/firetv/drmtest");
        adTagParameters.putString("cust_params", "tags=secretosucl,deportes,serie&program_name=secretosucl&program_id=2481&first_category=deportes&vertical=sport&content_source=tudn.com&season=1&category=deportes&video_type=fullepisode&episode=20&rating=tv-14&mcp_id=4010550&language=es&appbundle=com.univision.prendetv&deep_link=0&subscriber=1&row=");
        ima.putString("assetKey", "OJjJsVn4QYuWjxDW3i5WKw");
        ima.putMap("adTagParameters", adTagParameters);
        ima.putInt("startDate", startDate);
        ima.putInt("endDate", endDate);

        WritableMap aps = Arguments.createMap();
        aps.putBoolean("testMode", false);

        src.putMap("ima", ima);
        src.putBoolean("isAsset", false);
        src.putDouble("mainVer", 0.0);
        src.putMap("aps", aps);
        src.putString("id", "182788");
        src.putDouble("patchVer", 0.0);
        src.putBoolean("isNetwork", true);
        src.putString("channelName", "Test VLL DRM + SSAI - Big Buck Bunny");
        src.putString("uri", "https://dai.google.com/linear/hls/event/OJjJsVn4QYuWjxDW3i5WKw/master.m3u8");
        src.putString("type", "m3u8");

        return src;
    }
}
