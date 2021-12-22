package com.dice.util;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;

public class DorisHelper {

    private static final String TAG = "====";

    public static void logDceTracks(int trackType, ExoPlayer exoPlayer, DefaultTrackSelector trackSelector) {
        if (exoPlayer == null || trackSelector == null) {
            return;
        }
        int index = getTrackRendererIndex(trackType, exoPlayer);
        Log.d(TAG, "Tracks for trackType " + trackType + ", renderIndex " + index);
        if (index >= 0) {
            final MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
            if (mappedTrackInfo != null) {
                final TrackGroupArray tracks = mappedTrackInfo.getTrackGroups(index);
                TrackSelectionArray selections = exoPlayer.getCurrentTrackSelections();
                TrackSelection selected = null;
                for (int i = 0; i < selections.length; i++) {
                    if (exoPlayer.getRendererType(i) == trackType && selections.get(i) != null) {
                        selected = selections.get(i);
                    }
                }

                for (int i = 0; i < tracks.length; i++) {
                    TrackGroup group = tracks.get(i);
                    boolean isSelected = selected != null && tracks.indexOf(selected.getTrackGroup()) == i;
                    Format format = group.getFormat(0);
                    Log.d(TAG, String.format("    track %d - selected %b : %s", i, isSelected, Format.toLogString(format)));
                }
            }
        }
    }

    private static int getTrackRendererIndex(int trackType, ExoPlayer exoPlayer) {
        if (exoPlayer != null) {
            int rendererCount = exoPlayer.getRendererCount();
            for (int rendererIndex = 0; rendererIndex < rendererCount; rendererIndex++) {
                if (exoPlayer.getRendererType(rendererIndex) == trackType) {
                    return rendererIndex;
                }
            }
        }
        return C.INDEX_UNSET;
    }

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
        Log.d(TAG, builder.toString());

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

    public static ReadableMap getMockMobileStream() {
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
        adTagParameters.putString("vconp", "1");
        adTagParameters.putString("tfcd", "0");
        adTagParameters.putString("iu", "/6881/prendetv/live/firetv/drmtest");
        adTagParameters.putString("cust_params", "tags=secretosucl,deportes,serie&program_name=secretosucl&program_id=2481&first_category=deportes&vertical=sport&content_source=tudn.com&season=1&category=deportes&video_type=fullepisode&episode=20&rating=tv-14&mcp_id=4010550&language=es&appbundle=com.univision.prendetv&deep_link=0&subscriber=1&row=");
        ima.putString("assetKey", "OJjJsVn4QYuWjxDW3i5WKw");
        ima.putString("language", "es_US");
        ima.putMap("adTagParameters", adTagParameters);
        ima.putInt("startDate", startDate);
        ima.putInt("endDate", endDate);

        src.putMap("ima", ima);
        src.putBoolean("isAudioOnly", false);
        src.putString("id", "182788");
        src.putString("title", "Test VLL DRM + SSAI - Big Buck Bunny");
        src.putString("type", "LIVE");
        src.putBoolean("live", true);
        src.putDouble("progressUpdateInterval", 6.0);
        src.putDouble("retryTimes", 0.0);
        src.putString("imageUri", "https://img.dge-prod.dicelaboratory.com/thumbnails/182788/original/latest.jpg");
        src.putString("uri", "https://dai.google.com/linear/hls/event/OJjJsVn4QYuWjxDW3i5WKw/master.m3u8");

        return src;
    }
}
