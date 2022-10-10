package com.dice.util;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.endeavor.WebUtil;
import com.google.android.exoplayer2.util.Log;

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

    public static ReadableMap getCsaiVodStream() {
        WritableMap src = Arguments.createMap();

        src.putBoolean("isAudioOnly", false);
        src.putString("id", "182784");
        src.putString("title", "Test CSAI VOD - VMAP pre-roll single ad, mid-roll standard pod with 3 ads, post-roll single ad");
        src.putString("type", "VOD");
        src.putBoolean("live", false);
        src.putDouble("progressUpdateInterval", 6.0);
        src.putDouble("retryTimes", 0.0);
        src.putString("adTagUrl", "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpostpod&cmsid=496&vid=short_onecue&correlator=");
        src.putString("imageUri", "https://img.dge-prod.dicelaboratory.com/thumbnails/182788/original/latest.jpg");
        src.putString("uri", "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8");

        return src;
    }

    public static ReadableMap getSsaiVodStream() {
        WritableMap src = Arguments.createMap();

        WritableMap ima = Arguments.createMap();
        ima.putString("contentSourceId", "2528370");
        ima.putString("videoId", "tears-of-steel");

        src.putMap("ima", ima);
        src.putBoolean("isAudioOnly", false);
        src.putString("id", "182786");
        src.putString("title", "Test SSAI VOD - Tears of Steel (pre/mid/mid/mid/post), single ads [10s]");
        src.putString("type", "VOD");
        src.putBoolean("live", false);
        src.putDouble("progressUpdateInterval", 6.0);
        src.putDouble("retryTimes", 0.0);
        src.putString("imageUri", "https://img.dge-prod.dicelaboratory.com/thumbnails/182788/original/latest.jpg");
        src.putString("uri", "https://dai.google.com/linear/hls/event/OJjJsVn4QYuWjxDW3i5WKw/master.m3u8");

        return src;
    }

    public static ReadableMap getSsaiLiveStream() {
        WritableMap src = Arguments.createMap();

        WritableMap ima = Arguments.createMap();
        int startDate = (int) (System.currentTimeMillis() / 1000);
        int endDate = startDate + 6000;
        ima.putString("assetKey", "sN_IYUG8STe1ZzhIIE_ksA");
        ima.putInt("startDate", startDate);
        ima.putInt("endDate", endDate);

        src.putMap("ima", ima);
        src.putBoolean("isAudioOnly", false);
        src.putString("id", "182788");
        src.putString("title", "Test SSAI Live - Big Buck Bunny (mid), 3 ads each [10 s]");
        src.putString("type", "LIVE");
        src.putBoolean("live", true);
        src.putDouble("progressUpdateInterval", 6.0);
        src.putDouble("retryTimes", 0.0);
        src.putString("imageUri", "https://img.dge-prod.dicelaboratory.com/thumbnails/182788/original/latest.jpg");
        src.putString("uri", "https://dai.google.com/linear/hls/event/OJjJsVn4QYuWjxDW3i5WKw/master.m3u8");

        return src;
    }
}
