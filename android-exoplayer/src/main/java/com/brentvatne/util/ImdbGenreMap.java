package com.brentvatne.util;

import androidx.annotation.Nullable;

import com.google.common.collect.ImmutableMap;

import java.util.HashMap;

public final class ImdbGenreMap {

    private static final ImmutableMap<String, String> imdbGenreMap = ImmutableMap.<String, String>builder()
            .put("action", "Action")
            .put("adventure", "Adventure")
            .put("animation", "Animation")
            .put("autos", "Reality-TV")
            .put("biography", "Biography")
            .put("boxing", "Sport")
            .put("celebrity", "Drama")
            .put("children", "Family")
            .put("comedy", "Comedy")
            .put("crime", "Crime")
            .put("documentary", "Documentary")
            .put("drama", "Drama")
            .put("e/ichildren", "Family")
            .put("entertainment", "Drama")
            .put("family", "Family")
            .put("fantasy", "Fantasy")
            .put("finance", "News")
            .put("food", "Reality-TV")
            .put("gameshow", "Game Show")
            .put("health", "News")
            .put("history", "History")
            .put("home", "Drama")
            .put("horoscopes", "Drama")
            .put("horror", "Horror")
            .put("interview", "Talk Show")
            .put("lifestyle", "Drama")
            .put("local", "News")
            .put("martialarts", "Sport")
            .put("mixedmartialarts", "Sport")
            .put("movies", "Drama")
            .put("music", "Music")
            .put("musical", "Musical")
            .put("mystery", "Mystery")
            .put("nature", "Documentary")
            .put("news", "News")
            .put("novelas", "Drama")
            .put("publicaffairs", "News")
            .put("racing", "Sport")
            .put("realityshow", "Reality-TV")
            .put("religious", "Drama")
            .put("romance", "Romance")
            .put("sci-fi", "Sci-Fi")
            .put("scifi", "Sci-Fi")
            .put("soccer", "Sport")
            .put("special", "Drama")
            .put("sports", "Sport")
            .put("suspense", "Thriller")
            .put("talk", "Talk Show")
            .put("thriller", "Thriller")
            .put("travel", "Drama")
            .put("variety", "Drama")
            .put("war", "War")
            .put("western", "Western")
            .put("wrestling", "Sport")
            .build();

    // Prevents instantiation.
    private ImdbGenreMap() {
    }

    @Nullable
    public static String getImdbGenre(String genre) {
        return imdbGenreMap.get(genre);
    }
}
