package com.brentvatne.exoplayer;

import static android.content.Context.CAPTIONING_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.JELLY_BEAN_MR2;
import static com.brentvatne.exoplayer.LocaleUtils.getLanguageDisplayName;

import android.content.Context;
import android.view.accessibility.CaptioningManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.Parameters;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.ParametersBuilder;
import com.google.android.exoplayer2.trackselection.ExoTrackSelection;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector.MappedTrackInfo;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.util.Consumer;
import com.google.common.base.Predicate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class TracksUtil {

    private TracksUtil() {
    }

    static List<TrackInfo> getAudioTracks(@Nullable MappedTrackInfo info) {
        return getTracks(info, C.TRACK_TYPE_AUDIO);
    }

    static List<TrackInfo> getVideoTracks(@Nullable MappedTrackInfo info) {
        return getTracks(info, C.TRACK_TYPE_VIDEO);
    }

    static List<TrackInfo> getTextTracks(@Nullable MappedTrackInfo info) {
        return getTracks(info, C.TRACK_TYPE_TEXT);
    }

    @Nullable
    static TrackInfo getSelectedAudioTrack(@Nullable MappedTrackInfo info, @Nullable TrackSelectionArray selections) {
        return getSelectedTrack(info, selections, C.TRACK_TYPE_AUDIO);
    }

    @Nullable
    static TrackInfo getSelectedVideoTrack(@Nullable MappedTrackInfo info, @Nullable TrackSelectionArray selections) {
        return getSelectedTrack(info, selections, C.TRACK_TYPE_VIDEO);
    }

    @Nullable
    static TrackInfo getSelectedTextTrack(@Nullable MappedTrackInfo info, @Nullable TrackSelectionArray selections) {
        return getSelectedTrack(info, selections, C.TRACK_TYPE_TEXT);
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
                int renderIndex = TrackInfo.getRenderIndex(complexIndex);
                int groupIndex = TrackInfo.getGroupIndex(complexIndex);
                int trackIndex = TrackInfo.getTrackIndex(complexIndex);
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

    static boolean selectionChanged(@Nullable TrackSelectionArray lha, @Nullable TrackSelectionArray rha) {
        if (lha == null || lha != rha) {
            return true;
        } else {
            for (int i = 0; i < lha.length; i++) {
                ExoTrackSelection lhSelection = (ExoTrackSelection) lha.get(i);
                ExoTrackSelection rhSelection = ((ExoTrackSelection) rha.get(i));
                if (lhSelection != null && rhSelection != null &&
                        lhSelection.getSelectedFormat() != rhSelection.getSelectedFormat()) {
                    return true;
                }
            }
        }
        return false;
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

    private static List<TrackInfo> getTracks(@Nullable MappedTrackInfo info, int trackType) {
        if (info == null) return Collections.emptyList();
        ArrayList<TrackInfo> tracks = new ArrayList<>();
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            if (info.getRendererType(renderIndex) != trackType) continue;
            TrackGroupArray groups = info.getTrackGroups(renderIndex);
            for (int groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                TrackGroup group = groups.get(groupIndex);
                for (int trackIndex = 0; trackIndex < group.length; trackIndex++) {
                    if (info.getTrackSupport(renderIndex, groupIndex, trackIndex) == C.FORMAT_HANDLED) {
                        Format format = group.getFormat(trackIndex);
                        tracks.add(new TrackInfo(trackType, renderIndex, groupIndex, trackIndex, format));
                    }
                }
            }
        }
        return tracks;
    }

    private static TrackInfo getSelectedTrack(
            @Nullable MappedTrackInfo info,
            @Nullable TrackSelectionArray selections,
            int trackType) {
        if (info == null || selections == null) {
            return null;
        }
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            int rendererType = info.getRendererType(renderIndex);
            if (rendererType != trackType) continue;
            TrackSelection selection = selections.get(renderIndex);
            if (!(selection instanceof ExoTrackSelection)) continue;

            TrackGroupArray renderGroups = info.getTrackGroups(renderIndex);
            TrackGroup selectedTrackGroup = selection.getTrackGroup();
            Format selectedFormat = ((ExoTrackSelection) selection).getSelectedFormat();
            int groupIndex = renderGroups.indexOf(selectedTrackGroup);
            int formatIndex = selectedTrackGroup.indexOf(selectedFormat);
            return new TrackInfo(trackType, renderIndex, groupIndex, formatIndex, selectedFormat);
        }
        return null;

    }

    private static void iterateRenders(@Nullable MappedTrackInfo info, int trackType, Consumer<Integer> consumer) {
        if (info == null) {
            return;
        }
        for (int renderIndex = 0; renderIndex < info.getRendererCount(); renderIndex++) {
            if (info.getRendererType(renderIndex) == trackType) consumer.accept(renderIndex);
        }
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
}
