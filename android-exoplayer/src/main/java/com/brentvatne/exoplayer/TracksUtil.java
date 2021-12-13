package com.brentvatne.exoplayer;

import static android.content.Context.CAPTIONING_SERVICE;

import android.content.Context;
import android.os.Build;
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
            audioTrack.putString("title", format.id != null ? format.id : "");
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
            videoTrack.putInt("width", format.width == Format.NO_VALUE ? 0 : format.width);
            videoTrack.putInt("height", format.height == Format.NO_VALUE ? 0 : format.height);
            videoTrack.putInt("bitrate", format.bitrate == Format.NO_VALUE ? 0 : format.bitrate);
            videoTrack.putString("codecs", format.codecs != null ? format.codecs : "");
            videoTrack.putString("trackId", format.id == null ? String.valueOf(complexIndex) : format.id);
            return videoTrack;
        });
    }

    static WritableArray getTextTrackInfo(@Nullable MappedTrackInfo info) {
        return getAllTracks(info, C.TRACK_TYPE_TEXT, input -> {
            long complexIndex = input.first;
            Format format = input.second;
            WritableMap textTrack = Arguments.createMap();
            textTrack.putDouble("index", complexIndex);
            textTrack.putString("title", format.id != null ? format.id : "");
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
            Dynamic value) {
        List<TrackInfo> selection = new ArrayList<>();
        if (type == null) type = "system";
        switch (type) {
            case "disabled": {
                ParametersBuilder builder = initialParameters.buildUpon();
                for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
                    if (info.getRendererType(renderIndex) == trackType) {
                        builder.setRendererDisabled(renderIndex, true);
                    }
                }
                return builder.build();
            }
            case "language": {
                String expected = value.asString();
                TrackInfo track = searchTrack(info, trackType, format -> expected.equals(format.language));
                if (track != null) selection.add(track);
                break;
            }
            case "title": {
                String expected = value.asString();
                TrackInfo track = searchTrack(info, trackType, format -> expected.equals(format.id));
                if (track != null) selection.add(track);
                break;
            }
            case "resolution": {
                int expected = getDynamicInt(value);
                TrackInfo track = searchTrack(info, trackType, format -> expected == format.height);
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
            case "system": {
                String locale2 = Locale.getDefault().getLanguage(); // 2 letter code
                String locale3 = Locale.getDefault().getISO3Language(); // 3 letter code
                if (trackType == C.TRACK_TYPE_TEXT && Build.VERSION.SDK_INT > 18) { // Default subtitle selection
                    CaptioningManager captioningManager = (CaptioningManager) context.getSystemService(CAPTIONING_SERVICE);
                    if (captioningManager != null && captioningManager.isEnabled()) {
                        TrackInfo track = searchTrack(info, trackType, format ->
                                format.language != null && (format.language.equals(locale2) || format.language.equals(locale3))
                        );
                        if (track != null) selection.add(track);
                    }
                } else if (trackType == C.TRACK_TYPE_AUDIO) { // Default audio selection
                    TrackInfo track = searchTrack(info, trackType, format ->
                            format.language != null && (format.language.equals(locale2) || format.language.equals(locale3))
                    );
                    if (track != null) selection.add(track);
                }
                break;
            }
            default: {
                break;
            }
        }

        // Build selection params
        ParametersBuilder builder = initialParameters.buildUpon();
        boolean hasVideoSelected = false;
        boolean hasAudioSelected = false;
        for (TrackInfo track : selection) {
            if (track.type == C.TRACK_TYPE_VIDEO) hasVideoSelected = true;
            if (track.type == C.TRACK_TYPE_AUDIO) hasAudioSelected = true;
            int renderIndex = track.renderIndex;
            builder.setRendererDisabled(renderIndex, false);
            builder.clearSelectionOverrides(renderIndex);
            builder.setSelectionOverride(renderIndex, info.getTrackGroups(renderIndex),
                    new DefaultTrackSelector.SelectionOverride(track.groupIndex, track.trackIndex));
        }
        // Add all video tracks as valid options for ABR to choose from when there is no strict selection
        if (!hasVideoSelected) iterateRenders(info, C.TRACK_TYPE_VIDEO, renderIndex -> {
            builder.setRendererDisabled(renderIndex, false);
            builder.clearSelectionOverrides(renderIndex);
        });
        // Add all audio tracks as valid options for ABR to choose from when there is no strict selection
        if (!hasAudioSelected) iterateRenders(info, C.TRACK_TYPE_AUDIO, renderIndex -> {
            builder.setRendererDisabled(renderIndex, false);
            builder.clearSelectionOverrides(renderIndex);
        });
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
