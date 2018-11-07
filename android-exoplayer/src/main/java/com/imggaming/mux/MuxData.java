package com.imggaming.mux;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.android.exoplayer2.ExoPlayerLibraryInfo;
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.core.model.CustomerVideoData;

import java.util.Map;

public class MuxData {

    public static final String MUX_PLAYER_NAME = "react-native-video/dice";

    private static final String KEY_ENV_KEY = "envKey";
    private static final String KEY_USER_ID = "viewerUserId";

    private static final String KEY_VIDEO_TITLE = "videoTitle";
    private static final String KEY_VIDEO_ID = "videoId";
    private static final String KEY_VIDEO_SERIES = "videoSeries";
    private static final String KEY_VIDEO_DURATION = "videoDuration";
    private static final String KEY_VIDEO_IS_LIVE = "videoIsLive";
    private static final String KEY_VIDEO_STREAM_TYPE = "videoStreamType";
    private static final String KEY_VIDEO_CDN = "videoCdn";

    private final Map<String, Object> playbackData;

    public MuxData(@NonNull Map<String, Object> playbackData) {
        this.playbackData = playbackData;
    }

    @Nullable
    public CustomerVideoData getMuxVideoData() {
        if (playbackData != null) {
            final CustomerVideoData data = new CustomerVideoData();

            data.setVideoTitle(castToString(playbackData.get(KEY_VIDEO_TITLE)));
            data.setVideoId(castToString(playbackData.get(KEY_VIDEO_ID)));
            data.setVideoSeries(castToString(playbackData.get(KEY_VIDEO_SERIES)));
            data.setVideoDuration(castToLong(playbackData.get(KEY_VIDEO_DURATION)));
            data.setVideoIsLive(castToBoolean(playbackData.get(KEY_VIDEO_IS_LIVE)));
            data.setVideoStreamType(castToString(playbackData.get(KEY_VIDEO_STREAM_TYPE)));
            data.setVideoCdn(castToString(playbackData.get(KEY_VIDEO_CDN)));

            return data;
        }
        return null;
    }

    private String castToString(Object o) {
        if (o instanceof String) {
            return (String) o;
        }
        return null;
    }


    private Long castToLong(Object o) {
        if (o instanceof Long) {
            return (Long) o;
        }
        return null;
    }

    private Boolean castToBoolean(Object o) {
        if (o instanceof Boolean) {
            return (Boolean) o;
        }
        return null;
    }

    @Nullable
    public CustomerPlayerData getCustomerPlayerData() {

        if (playbackData != null) {
            final String envId = castToString(playbackData.get(KEY_ENV_KEY));

            if (envId != null) {
                CustomerPlayerData customerPlayerData = new CustomerPlayerData();
                customerPlayerData.setEnvironmentKey(envId);
                customerPlayerData.setViewerUserId(castToString(playbackData.get(KEY_USER_ID)));
                customerPlayerData.setPlayerName(MUX_PLAYER_NAME);
                customerPlayerData.setPlayerVersion(ExoPlayerLibraryInfo.VERSION_SLASHY);
                return customerPlayerData;
            }
        }


        return null;
    }
}
