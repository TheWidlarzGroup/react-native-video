package com.imggaming.tracks;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.media3.common.C;
import androidx.media3.common.Format;
import androidx.media3.common.TrackGroup;
import androidx.media3.common.TrackSelectionOverride;
import androidx.media3.common.Tracks;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.TrackGroupArray;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector.Parameters;
import androidx.media3.exoplayer.trackselection.MappingTrackSelector;

import com.brentvatne.react.R;
import com.google.common.collect.ImmutableList;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class DcePlayerModel {

    private final ExoPlayer player;
    private final Context context;
    private DefaultTrackSelector trackSelector;
    private boolean areAnnotationsEnabled; //ToDo: this needs to come from player

    public DcePlayerModel(Context context, ExoPlayer player, DefaultTrackSelector selector) {
        this.context = context;
        this.player = player;
        this.trackSelector = selector;
    }

    public boolean areAudioTracksAvailable() {
        return findTrackTypeAvailable(C.TRACK_TYPE_AUDIO) >= 0;
    }
    public boolean areSubtitlesAvailable() {
        return findTrackTypeAvailable(C.TRACK_TYPE_TEXT) >= 0;
    }

    private int findTrackTypeAvailable(int type) {
        final MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
        if (mappedTrackInfo == null) {
            return -1;
        }

        for (int i = 0; i < mappedTrackInfo.getRendererCount(); i++) {
            TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(i);
            if (trackGroups
                    .length != 0) {
                if (player.getRendererType(i) == type && hasLabel(trackGroups)) {
                    return i;
                }
            }
        }

        return -1;
    }

    public DceTrack getSelectedAudioTrack() {
        ArrayList<DceTrack> tracks = getAudioTracks();

        for (DceTrack track : tracks) {
            if (track.isSelected()) {
                return track;
            }
        }

        return new DceTrack(context.getString(R.string.dce_tracks_off), true);
    }

    public DceTrack getSelectedSubtitlesTrack() {
        ArrayList<DceTrack> tracks = getSubtitles();

        for (DceTrack track : tracks) {
            if (track.isSelected()) {
                return track;
            }
        }

        return new DceTrack(context.getString(R.string.dce_tracks_off), true);
    }

    public void setAudioTracks(List<DceTrack> tracks) {
        selectTracks(C.TRACK_TYPE_AUDIO, tracks);
    }

    public void setSubtitles(List<DceTrack> tracks) {

        ArrayList<DceTrack> trackArrayList = new ArrayList<>();
        for (DceTrack track : tracks) {
            trackArrayList.add(track);
        }
        if (trackArrayList.size() > 0) {
            trackArrayList.remove(0); //remove off options
        }

        selectTracks(C.TRACK_TYPE_TEXT, trackArrayList);
    }

    public class DceTrack {
        private final String name;
        private final int index;
        private boolean selected;

        public DceTrack(String name, int index, boolean selected) {
            this.name = name;
            this.index = index;
            this.selected = selected;
        }

        public DceTrack(String name, boolean selected) {
            this(name, -1, selected);
        }

        public String getName() {
            return this.name;
        }

        public int getIndex() {
            return this.index;
        }

        public boolean isSelected() {
            return this.selected;
        }

        public void setSelected(boolean selected) {
            this.selected = selected;
        }
    }

    public ArrayList<DceTrack> getAudioTracks() {
        return getDceTracks(C.TRACK_TYPE_AUDIO);
    }

    public ArrayList<DceTrack> getSubtitles() {
        final ArrayList<DceTrack> tracks = getDceTracks(C.TRACK_TYPE_TEXT);

        boolean areSubtitlesEnabled = false;

        for (DceTrack track : tracks) {
            if (track.isSelected()) {
                areSubtitlesEnabled = true;
                break;
            }
        }

        tracks.add(0, new DceTrack(context.getString(R.string.dce_tracks_off), !areSubtitlesEnabled));

        return tracks;
    }

    private ArrayList<DceTrack> getDceTracks(int trackType) {
        final ArrayList<DceTrack> ret = new ArrayList<>();
        final Set<String> addedLanguages = new HashSet<>();

        int index = findTrackTypeAvailable(trackType);

        if (index >= 0) {

            final MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
            if (mappedTrackInfo != null) {
                Tracks tracks = player.getCurrentTracks();
                for (int i = 0; i < tracks.getGroups().size(); i++) {
                    Tracks.Group groupInfo = tracks.getGroups().get(i);
                    if (groupInfo.getType() != trackType) {
                        continue;
                    }
                    TrackGroup group = groupInfo.getMediaTrackGroup();
                    String languageLabel = getLabel(group);
                    if (TextUtils.isEmpty(languageLabel)) {
                        continue;
                    }
                    boolean isSelected = groupInfo.isSelected();

                    Log.d(DcePlayerModel.class.getName(), " group =  " + languageLabel + " selected = " + isSelected);

                    if(!addedLanguages.contains(languageLabel)){
                        ret.add(new DceTrack(languageLabel, i, isSelected));
                        addedLanguages.add(languageLabel);
                    }
                }
            }
        }

        return ret;
    }

    private String getLabel(TrackGroup group) {
        Format format = group.length > 0 ? group.getFormat(0) : null;
        String language = format != null ? format.language : null;
        return language != null ? new Locale(language.replaceAll("_", "-")).getDisplayName() : null;
    }

    private boolean hasLabel(TrackGroupArray trackGroups) {
        for (int i = 0; i < trackGroups.length; i++) {
            if (!TextUtils.isEmpty(getLabel(trackGroups.get(i)))) {
                return true;
            }
        }
        return false;
    }

    private void selectTracks(int trackType, List<DceTrack> tracks) {
        final int index = findTrackTypeAvailable(trackType);

        if (index >= 0) {
            Parameters.Builder parametersBuilder = trackSelector.buildUponParameters();

            ImmutableList<Tracks.Group> groups = player.getCurrentTracks().getGroups();

            int selected = -1;

            for (int i = 0; i < tracks.size(); i++) {
                final DceTrack track = tracks.get(i);
                if (track.isSelected()) {
                    selected = track.getIndex();
                }
            }

            if (selected >= 0) {
                parametersBuilder.setOverrideForType(new TrackSelectionOverride(groups.get(selected).getMediaTrackGroup(), 0));
            } else {
                parametersBuilder.clearOverridesOfType(trackType);
            }

            if (trackType == C.TRACK_TYPE_TEXT) { // enable/disable subtitles renderer
                parametersBuilder.setRendererDisabled(index, selected < 0);
            }

            trackSelector.setParameters(parametersBuilder);
        }
    }
}
