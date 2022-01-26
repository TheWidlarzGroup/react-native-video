package com.brentvatne.exoplayer;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.LOLLIPOP;

import androidx.annotation.Nullable;

import com.google.android.exoplayer2.util.Util;

import java.util.Locale;

public class LocaleUtils {

    private LocaleUtils() {
    }

    static String getLanguageDisplayName(@Nullable String lang) {
        if (lang == null) return "";
        String normalizedLang = Util.normalizeLanguageCode(lang);
        Locale locale = SDK_INT >= LOLLIPOP ? Locale.forLanguageTag(normalizedLang) : new Locale(normalizedLang);
        String display = locale.getDisplayName(locale);
        if (display.length() > 0) display = display.substring(0, 1).toUpperCase() + display.substring(1);
        return display;
    }
}
