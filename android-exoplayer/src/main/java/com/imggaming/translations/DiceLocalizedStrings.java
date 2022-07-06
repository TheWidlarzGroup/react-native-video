package com.imggaming.translations;

import java.util.HashMap;
import java.util.Map;

public class DiceLocalizedStrings {

    private static final Map<String, String> fallbackTranslations = new HashMap<String, String>() {{
        put(StringId.player_play_button.name(), "Play");
        put(StringId.player_pause_button.name(), "Pause");
        put(StringId.player_audio_and_subtitles_button.name(), "Audio & Subtitles");
        put(StringId.player_epg_button.name(), "Schedule");
        put(StringId.player_stats_button.name(), "Stats");
        put(StringId.epgProgrammeStartBeginning.name(), "Watch from Beginning");
        put(StringId.epgProgrammeStartLive.name(), "Watch from Live");
    }};

    private static DiceLocalizedStrings sInstance;

    private Map<String, String> map;

    public static synchronized DiceLocalizedStrings getInstance() {
        if (sInstance == null) {
            sInstance = new DiceLocalizedStrings();
        }
        return sInstance;
    }

    public void updateTranslations(Map<String, String> map) {
        this.map = map;
    }

    public String string(StringId id) {
        return string(id.name());
    }

    private String string(String id) {
        String translation = null;
        if (map != null) {
            translation = map.get(id);
        }

        if (translation == null) {
            translation = fallbackTranslations.get(id);
        }

        return translation;
    }

    /**
     * Keys for translations that need to be provided by JS.
     */
    public enum StringId {
        player_play_button,
        player_pause_button,
        player_audio_and_subtitles_button,
        player_epg_button,
        player_stats_button,
        epgProgrammeStartBeginning, // Watch from beginning
        epgProgrammeStartLive, // Watch from live
    }

}
