package com.imggaming.tracks;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

/**
 * A singleton storage that can be used to persist the preferred subtitle/audio track selections.
 */
public class TrackPreferenceStorage {

    public static final String NONE = "none";

    private static TrackPreferenceStorage INSTANCE;
    private final SharedPreferences sharedPreferences;
    private boolean enabled;

    private TrackPreferenceStorage(Context context) {
        sharedPreferences = context.getSharedPreferences("trackPreferenceStorage", Context.MODE_PRIVATE);
    }

    public static TrackPreferenceStorage getInstance(Context context) {
        if (INSTANCE == null) {
            INSTANCE = new TrackPreferenceStorage(context.getApplicationContext());
        }
        return INSTANCE;
    }

    /**
     * Turn on/off the track preference storage. If this has been set to disabled, then the storage
     * won't save any preferences and {@code getPreferredSubtitleLanguage}/{@code getPreferredAudioLanguage}
     * will return null.
     *
     * @param enabled Whether to enable the track preference storage.
     */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * @return Return whether the track preference storage is turned on.
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Stores the preferred subtitle language.
     *
     * @param lang The language code of the subtitle.
     */
    public void storePreferredSubtitleLanguage(String lang) {
        if (!enabled) return;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("preferredSubtitleLanguage", lang);
        editor.apply();
    }

    /**
     * @return Returns the preferred subtitle language, or null if there is none.
     */
    @Nullable
    public String getPreferredSubtitleLanguage() {
        if (!enabled) return null;
        return sharedPreferences.getString("preferredSubtitleLanguage", null);
    }

    /**
     * @return Returns whether no subtitle is preferred.
     */
    public boolean isNoSubtitlePreferred() {
        if (!enabled) return false;
        return NONE.equals(getPreferredSubtitleLanguage());
    }

    /**
     * Stores the preferred audio language.
     *
     * @param lang The language code of the audio.
     */
    public void storePreferredAudioLanguage(String lang) {
        if (!enabled) return;
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("preferredAudioLanguage", lang);
        editor.apply();
    }

    /**
     * @return Returns the preferred audio language, or null if there is none.
     */
    @Nullable
    public String getPreferredAudioLanguage() {
        if (!enabled) return null;
        return sharedPreferences.getString("preferredAudioLanguage", null);
    }
}
