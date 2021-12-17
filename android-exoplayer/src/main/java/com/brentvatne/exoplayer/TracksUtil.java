package com.brentvatne.exoplayer;

import static android.content.Context.CAPTIONING_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.JELLY_BEAN_MR2;
import static android.os.Build.VERSION_CODES.LOLLIPOP;

import android.content.Context;
import android.util.Pair;
import android.view.accessibility.CaptioningManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.Parameters;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.ParametersBuilder;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector.MappedTrackInfo;
import com.google.android.exoplayer2.util.Consumer;
import com.google.android.exoplayer2.util.Util;
import com.google.common.base.Function;
import com.google.common.base.Predicate;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TracksUtil {

    private static final int SHORT_BYTES = 2;
    private static final int LONG_BYTES = 8;

    private TracksUtil() {
    }

    static WritableArray getAudioTrackInfo(@Nullable MappedTrackInfo info) {
        return getAllTracks(info, C.TRACK_TYPE_AUDIO, input -> {
            long complexIndex = input.first;
            Format format = input.second;
            WritableMap audioTrack = Arguments.createMap();
            audioTrack.putDouble("index", complexIndex);
            audioTrack.putString("trackId", format.id != null ? format.id : "");
            audioTrack.putString("title", getLanguageDisplayName(format.language));
            audioTrack.putString("type", format.sampleMimeType);
            audioTrack.putString("language", format.language != null ? format.language : "");
            audioTrack.putString("bitrate", format.bitrate == Format.NO_VALUE ? ""
                    : String.format(Locale.US, "%.2fMbps", format.bitrate / 1000000f));
            return audioTrack;
        });
    }

    static WritableArray getVideoTrackInfo(@Nullable MappedTrackInfo info) {
        return getAllTracks(info, C.TRACK_TYPE_VIDEO, input -> {
            long complexIndex = input.first;
            Format format = input.second;
            WritableMap videoTrack = Arguments.createMap();
            videoTrack.putDouble("index", complexIndex);
            videoTrack.putString("trackId", format.id != null ? format.id : "");
            videoTrack.putInt("width", format.width == Format.NO_VALUE ? 0 : format.width);
            videoTrack.putInt("height", format.height == Format.NO_VALUE ? 0 : format.height);
            videoTrack.putInt("bitrate", format.bitrate == Format.NO_VALUE ? 0 : format.bitrate);
            videoTrack.putString("codecs", format.codecs != null ? format.codecs : "");
            return videoTrack;
        });
    }

    static WritableArray getTextTrackInfo(@Nullable MappedTrackInfo info) {
        return getAllTracks(info, C.TRACK_TYPE_TEXT, input -> {
            long complexIndex = input.first;
            Format format = input.second;
            WritableMap textTrack = Arguments.createMap();
            textTrack.putDouble("index", complexIndex);
            textTrack.putString("trackId", format.id != null ? format.id : "");
            textTrack.putString("title", getLanguageDisplayName(format.language));
            textTrack.putString("type", format.sampleMimeType);
            textTrack.putString("language", format.language != null ? format.language : "");
            return textTrack;
        });
    }

    static Parameters buildSelectionParameters(
            Context context,
            Parameters initialParameters,
            @NonNull MappedTrackInfo info,
            int trackType,
            @Nullable String type,
            @Nullable Dynamic value) {
        List<TrackInfo> selection = new ArrayList<>();
        ParametersBuilder builder = initialParameters.buildUpon();
        if (type == null || value == null) type = "default";
        switch (type) {
            case "disabled": {
                for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
                    if (info.getRendererType(renderIndex) == trackType) {
                        builder.setRendererDisabled(renderIndex, true);
                    }
                }
                // return without changing any overrides
                return builder.build();
            }
            case "language": {
                String expected = value.asString();
                if (trackType == C.TRACK_TYPE_AUDIO) {
                    builder.setPreferredAudioLanguage(expected);
                } else if (trackType == C.TRACK_TYPE_TEXT) {
                    builder.setPreferredTextLanguage(expected);
                }
                break;
            }
            case "title": {
                String expected = value.asString();
                TrackInfo track = searchTrack(info, trackType, format ->
                        expected.equals(getLanguageDisplayName(format.language))
                );
                if (track != null) selection.add(track);
                break;
            }
            case "resolution": {
                int expected = getDynamicInt(value);
                TrackInfo track = searchTrack(info, trackType, format ->
                        expected == format.height
                );
                if (track != null) selection.add(track);
                break;
            }
            case "index": {
                long complexIndex = getDynamicLong(value);
                ByteBuffer tmpIndicesOut = ByteBuffer.allocate(LONG_BYTES);
                populateIndices(complexIndex, tmpIndicesOut);
                int renderIndex = tmpIndicesOut.getShort(0);
                int groupIndex = tmpIndicesOut.getShort(0 + SHORT_BYTES);
                int trackIndex = tmpIndicesOut.getShort(0 + SHORT_BYTES + SHORT_BYTES);
                if (renderIndex >= 0 && renderIndex < info.getRendererCount()) {
                    TrackGroupArray groups = info.getTrackGroups(renderIndex);
                    if (groupIndex >= 0 && groupIndex < groups.length) {
                        TrackGroup group = groups.get(groupIndex);
                        if (trackIndex >= 0 && trackIndex < group.length) {
                            Format format = group.getFormat(trackIndex);
                            int selectionTrackTypeType = info.getRendererType(renderIndex);
                            selection.add(new TrackInfo(selectionTrackTypeType, renderIndex, groupIndex, trackIndex, format));
                        }
                    }
                }
                break;
            }
            case "auto":
            case "system":
            case "default": {
                // Enable all renders and clear any strict selection overrides
                // In case of C.TRACK_TYPE_VIDEO - all video tracks as valid options for ABR to choose from
                iterateRenders(info, trackType, renderIndex -> {
                    builder.setRendererDisabled(renderIndex, false);
                    builder.clearSelectionOverrides(renderIndex);
                });

                // Apply audio/subtitle selection base on current locale
                Locale currentLocale = Locale.getDefault();
                String locale2 = currentLocale.getLanguage(); // 2 letter code
                String locale3 = currentLocale.getISO3Language(); // 3 letter code

                if (trackType == C.TRACK_TYPE_AUDIO) { // Default audio selection
                    TrackInfo track = searchTrack(info, trackType, format ->
                            format.language != null && (format.language.equals(locale2) || format.language.equals(locale3))
                    );
                    String preferred = track != null ? track.format.language : null;
                    builder.setPreferredAudioLanguage(preferred);
                } else if (trackType == C.TRACK_TYPE_TEXT) { // Default subtitle selection
                    if (SDK_INT > JELLY_BEAN_MR2) {
                        CaptioningManager captioning = (CaptioningManager) context.getSystemService(CAPTIONING_SERVICE);
                        if (captioning != null && captioning.isEnabled()) {
                            TrackInfo track = searchTrack(info, trackType, format ->
                                    format.language != null && (format.language.equals(locale2) || format.language.equals(locale3))
                            );
                            String preferred = track != null ? track.format.language : null;
                            builder.setPreferredTextLanguage(preferred);
                        }
                    } else {
                        builder.setPreferredTextLanguage(null);
                    }
                }
                break;
            }
            default: {
                break;
            }
        }

        // Apply strict selection overrides
        for (TrackInfo track : selection) {
            int renderIndex = track.renderIndex;
            builder.setRendererDisabled(renderIndex, false);
            builder.clearSelectionOverrides(renderIndex);
            builder.setSelectionOverride(renderIndex, info.getTrackGroups(renderIndex),
                    new DefaultTrackSelector.SelectionOverride(track.groupIndex, track.trackIndex));
        }
        return builder.build();
    }

    private static WritableArray getAllTracks(@Nullable MappedTrackInfo info, int trackType, Function<Pair<Long, Format>, WritableMap> transformation) {
        WritableArray tracks = Arguments.createArray();
        ByteBuffer tmpIndicesOut = ByteBuffer.allocate(LONG_BYTES);
        iterateTracks(info, trackType, trackInfo -> {
            populateIndices(trackInfo.renderIndex, trackInfo.groupIndex, trackInfo.trackIndex, tmpIndicesOut);
            long complexIndex = tmpIndicesOut.getLong(0);
            tracks.pushMap(transformation.apply(Pair.create(complexIndex, trackInfo.format)));

        });
        return tracks;
    }

    @Nullable
    private static TrackInfo searchTrack(@NonNull MappedTrackInfo info, int trackType, Predicate<Format> predicate) {
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            if (info.getRendererType(renderIndex) != trackType) continue;
            TrackGroupArray groups = info.getTrackGroups(renderIndex);
            for (int groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                TrackGroup group = groups.get(groupIndex);
                for (int trackIndex = 0; trackIndex < group.length; trackIndex++) {
                    if (info.getTrackSupport(renderIndex, groupIndex, trackIndex) == C.FORMAT_HANDLED) {
                        Format format = group.getFormat(trackIndex);
                        if (predicate.apply(format)) {
                            return new TrackInfo(trackType, renderIndex, groupIndex, trackIndex, format);
                        }
                    }
                }
            }
        }
        return null;
    }

    private static void iterateTracks(@Nullable MappedTrackInfo info, int trackType, Consumer<TrackInfo> consumer) {
        if (info == null) {
            return;
        }
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            if (info.getRendererType(renderIndex) != trackType) continue;
            TrackGroupArray groups = info.getTrackGroups(renderIndex);
            for (int groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                TrackGroup group = groups.get(groupIndex);
                for (int trackIndex = 0; trackIndex < group.length; trackIndex++) {
                    if (info.getTrackSupport(renderIndex, groupIndex, trackIndex) == C.FORMAT_HANDLED) {
                        Format format = group.getFormat(trackIndex);
                        consumer.accept(new TrackInfo(trackType, renderIndex, groupIndex, trackIndex, format));
                    }
                }
            }
        }
    }

    private static void iterateRenders(@Nullable MappedTrackInfo info, int trackType, Consumer<Integer> consumer) {
        if (info == null) {
            return;
        }
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            if (info.getRendererType(renderIndex) == trackType) consumer.accept(renderIndex);
        }
    }

    private static void populateIndices(int renderIndex, int groupIndex, int trackIndex, ByteBuffer out) {
        out.clear();
        out.putShort(((short) renderIndex));
        out.putShort(((short) groupIndex));
        out.putShort(((short) trackIndex));
    }

    private static void populateIndices(long complexIndex, ByteBuffer out) {
        out.clear();
        out.putLong(complexIndex);
    }

    private static String getLanguageDisplayName(@Nullable String lang) {
        if (lang == null) return "";
        String normalizedLang = Util.normalizeLanguageCode(lang);
        Locale locale = SDK_INT >= LOLLIPOP ? Locale.forLanguageTag(normalizedLang) : new Locale(normalizedLang);
        String display = locale.getDisplayName(locale);
        if (display.length() > 0) display = display.substring(0, 1).toUpperCase() + display.substring(1);
        return display;
    }

    private static long getDynamicLong(Dynamic value) {
        if (value.getType() == ReadableType.Number)
            return ((long) value.asDouble());
        else if (value.getType() == ReadableType.String)
            return Long.parseLong(value.asString());
        else
            throw new IllegalArgumentException("Unable to read long from " + value);
    }

    private static int getDynamicInt(Dynamic value) {
        if (value.getType() == ReadableType.Number)
            return ((int) value.asDouble());
        else if (value.getType() == ReadableType.String)
            return Integer.parseInt(value.asString());
        else
            throw new IllegalArgumentException("Unable to read int from " + value);
    }

    private static final class TrackInfo {
        public final int type;
        public final int renderIndex;
        public final int groupIndex;
        public final int trackIndex;
        public final Format format;

        public TrackInfo(int type, int renderIndex, int groupIndex, int trackIndex, Format format) {
            this.type = type;
            this.renderIndex = renderIndex;
            this.groupIndex = groupIndex;
            this.trackIndex = trackIndex;
            this.format = format;
        }
    }

}
