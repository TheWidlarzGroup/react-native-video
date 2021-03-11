package com.brentvatne.entity;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.diceplatform.doris.entity.TextTrack;

import java.util.Map;

public class RNSource {

    private String url;
    private String extension;

    private final boolean isLive;
    private final TextTrack[] textTracks;
    private final Map<String, String> headers;
    private final Map<String, Object> muxData;
    private final String selectedAudioTrack;
    private final String locale;
    private final String channelId;
    private final String seriesId;
    private final String seasonId;
    private final String playlistId;
    private final boolean apsTestFlag;

    public RNSource(
            @NonNull String url,
            @Nullable String extension,
            boolean isLive,
            @Nullable TextTrack[] textTracks,
            @Nullable Map<String, String> headers,
            @Nullable Map<String, Object> muxData,
            @Nullable String selectedAudioTrack,
            @Nullable String locale,
            @Nullable String channelId,
            @Nullable String seriesId,
            @Nullable String seasonId,
            @Nullable String playlistId,
            boolean apsTestFlag) {
        this.url = url;
        this.extension = extension;
        this.isLive = isLive;
        this.textTracks = textTracks;
        this.headers = headers;
        this.muxData = muxData;
        this.selectedAudioTrack = selectedAudioTrack;
        this.locale = locale;
        this.channelId = channelId;
        this.seriesId = seriesId;
        this.seasonId = seasonId;
        this.playlistId = playlistId;
        this.apsTestFlag = apsTestFlag;
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
    public String getSelectedAudioTrack() {
        return selectedAudioTrack;
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

    public boolean getApsTestFlag() {
        return apsTestFlag;
    }
}
