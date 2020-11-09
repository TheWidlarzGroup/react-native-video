package com.brentvatne.entity;

import androidx.annotation.NonNull;

import java.util.Map;

public class RNTranslations {

    private static final String KEY_EPG_LABEL = "player_epg_button";
    private static final String KEY_STATS_LABEL = "player_stats_button";
    private static final String KEY_PLAY_LABEL = "player_play_button";
    private static final String KEY_PAUSE_LABEL = "player_pause_button";
    private static final String KEY_AUDIO_AND_SUBTITLES_LABEL = "player_audio_and_subtitles_button";
    private static final String KEY_LIVE_LABEL = "live";
    private static final String KEY_FAVORITE_LABEL = "favourite";
    private static final String KEY_MORE_VIDEOS_LABEL = "moreVideos";
    private static final String KEY_WATCH_LIST_LABEL = "watchlist";

    private static final String DEFAULT_EPG_LABEL = "Schedule";
    private static final String DEFAULT_STATS_LABEL = "Stats";
    private static final String DEFAULT_PLAY_LABEL = "Play";
    private static final String DEFAULT_PAUSE_LABEL = "Pause";
    private static final String DEFAULT_AUDIO_AND_SUBTITLES_LABEL = "Audio & Subtitles";
    private static final String DEFAULT_LIVE_LABEL = "Live";
    private static final String DEFAULT_FAVORITE_LABEL = "Favourite";
    private static final String DEFAULT_MORE_VIDEOS_LABEL = "More Videos";
    private static final String DEFAULT_WATCH_LIST_LABEL = "Watch List";

    private final String epgLabel;
    private final String statsLabel;
    private final String playLabel;
    private final String pauseLabel;
    private final String audioAndSubtitlesLabel;
    private final String liveLabel;
    private final String favoriteLabel;
    private final String moreVideosLabel;
    private final String watchListLabel;

    public RNTranslations(@NonNull Map<String, Object> translations) {
        this.epgLabel = getStringFromMap(translations, KEY_EPG_LABEL, DEFAULT_EPG_LABEL);
        this.statsLabel = getStringFromMap(translations, KEY_STATS_LABEL, DEFAULT_STATS_LABEL);
        this.playLabel = getStringFromMap(translations, KEY_PLAY_LABEL, DEFAULT_PLAY_LABEL);
        this.pauseLabel = getStringFromMap(translations, KEY_PAUSE_LABEL, DEFAULT_PAUSE_LABEL);
        this.audioAndSubtitlesLabel = getStringFromMap(translations,
                                                       KEY_AUDIO_AND_SUBTITLES_LABEL,
                                                       DEFAULT_AUDIO_AND_SUBTITLES_LABEL);
        this.liveLabel = getStringFromMap(translations, KEY_LIVE_LABEL, DEFAULT_LIVE_LABEL);
        this.favoriteLabel = getStringFromMap(translations,
                                              KEY_FAVORITE_LABEL,
                                              DEFAULT_FAVORITE_LABEL);
        this.moreVideosLabel = getStringFromMap(translations,
                                                KEY_MORE_VIDEOS_LABEL,
                                                DEFAULT_MORE_VIDEOS_LABEL);
        this.watchListLabel = getStringFromMap(translations,
                                               KEY_WATCH_LIST_LABEL,
                                               DEFAULT_WATCH_LIST_LABEL);
    }

    private String getStringFromMap(
            Map<String, Object> translations,
            String key,
            String defaultValue) {
        return translations.get(key) != null ? (String) translations.get(key) : defaultValue;
    }

    public String getEpgLabel() {
        return epgLabel;
    }

    public String getStatsLabel() {
        return statsLabel;
    }

    public String getPlayLabel() {
        return playLabel;
    }

    public String getPauseLabel() {
        return pauseLabel;
    }

    public String getAudioAndSubtitlesLabel() {
        return audioAndSubtitlesLabel;
    }

    public String getLiveLabel() {
        return liveLabel;
    }

    public String getFavoriteLabel() {
        return favoriteLabel;
    }

    public String getMoreVideosLabel() {
        return moreVideosLabel;
    }

    public String getWatchListLabel() {
        return watchListLabel;
    }
}
