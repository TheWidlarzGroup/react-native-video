package com.brentvatne.entity;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.endeavor.LimitedSeekRange;

import com.diceplatform.doris.entity.ImaCsaiProperties;
import com.diceplatform.doris.entity.TextTrack;
import com.diceplatform.doris.entity.YoSsaiProperties;

import java.util.List;
import java.util.Map;

public class RNSource {

    private String url;
    private String mimeType;
    private String extension;

    private final String id;
    private final boolean isLive;
    private final TextTrack[] textTracks;
    private final Map<String, String> headers;
    private final Map<String, Object> muxData;
    private final List<String> preferredAudioTracks;
    private final String selectedSubtitleTrack;
    private final String locale;
    private final String channelId;
    private final String seriesId;
    private final String seasonId;
    private final String playlistId;
    private final int duration;
    private final String channelName;
    private final boolean apsTestFlag;
    private final ImaCsaiProperties imaCsai;
    private final YoSsaiProperties yoSsai;
    private final LimitedSeekRange limitedSeekRange;

    public RNSource(
            @NonNull String url,
            @Nullable String mimeType,
            @NonNull String id,
            @Nullable String extension,
            boolean isLive,
            @Nullable TextTrack[] textTracks,
            @Nullable Map<String, String> headers,
            @Nullable Map<String, Object> muxData,
            @Nullable List<String> preferredAudioTracks,
            @Nullable String selectedSubtitleTrack,
            @Nullable String locale,
            @Nullable String channelId,
            @Nullable String seriesId,
            @Nullable String seasonId,
            @Nullable String playlistId,
            int duration,
            @Nullable String channelName,
            boolean apsTestFlag,
            @Nullable ImaCsaiProperties imaCsai,
            @Nullable YoSsaiProperties yoSsai,
            @Nullable LimitedSeekRange limitedSeekRange) {
        this.id = id;
        this.url = url;
        this.mimeType = mimeType;
        this.extension = extension;
        this.isLive = isLive;
        this.textTracks = textTracks;
        this.headers = headers;
        this.muxData = muxData;
        this.preferredAudioTracks = preferredAudioTracks;
        this.selectedSubtitleTrack = selectedSubtitleTrack;
        this.locale = locale;
        this.channelId = channelId;
        this.seriesId = seriesId;
        this.seasonId = seasonId;
        this.playlistId = playlistId;
        this.channelName = channelName;
        this.duration = duration;
        this.apsTestFlag = apsTestFlag;
        this.imaCsai = imaCsai;
        this.yoSsai = yoSsai;
        this.limitedSeekRange = limitedSeekRange;
    }

    @NonNull
    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setUri(Uri uri) {
        this.url = uri.toString();
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public String getExtension() {
        return extension;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public boolean isLive() {
        return isLive;
    }

    @Nullable
    public TextTrack[] getTextTracks() {
        return textTracks;
    }

    @Nullable
    public Map<String, String> getHeaders() {
        return headers;
    }

    @Nullable
    public Map<String, Object> getMuxData() {
        return muxData;
    }

    @Nullable
    public List<String> getPreferredAudioTracks() {
        return preferredAudioTracks;
    }

    @Nullable
    public String getSelectedSubtitleTrack() {
        return selectedSubtitleTrack;
    }

    @Nullable
    public String getLocale() {
        return locale;
    }

    @Nullable
    public String getChannelId() {
        return channelId;
    }

    @Nullable
    public String getSeriesId() {
        return seriesId;
    }

    @Nullable
    public String getSeasonId() {
        return seasonId;
    }

    @Nullable
    public String getPlaylistId() {
        return playlistId;
    }

    public int getDuration() {
        return duration;
    }

    public String getChannelName() {
        return channelName;
    }

    public boolean getApsTestFlag() {
        return apsTestFlag;
    }

    public ImaCsaiProperties getImaCsai() {
        return imaCsai;
    }

    public YoSsaiProperties getYoSsai() {
        return yoSsai;
    }

    public LimitedSeekRange getLimitedSeekRange() {
        return limitedSeekRange;
    }
}
