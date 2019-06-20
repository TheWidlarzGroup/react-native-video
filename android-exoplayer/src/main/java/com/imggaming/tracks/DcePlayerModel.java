package com.imggaming.tracks;

import android.content.Context;
import android.util.Log;

import com.brentvatne.react.R;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.ParametersBuilder;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.SelectionOverride;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class DcePlayerModel {

    private final Player player;
    private final Context context;
    private DefaultTrackSelector trackSelector;
    private boolean areAnnotationsEnabled; //ToDo: this needs to come from player

    public DcePlayerModel(Context context, Player player, DefaultTrackSelector selector) {
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
            if (trackGroups.length != 0) {
                if (player.getRendererType(i) == type) {
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

        int index = findTrackTypeAvailable(trackType);

        if (index >= 0) {

            final MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
            if (mappedTrackInfo != null) {
                final TrackGroupArray tracks = mappedTrackInfo.getTrackGroups(index);

                TrackSelectionArray selections = player.getCurrentTrackSelections();

                TrackSelection selected = null;

                for (int i = 0; i < selections.length; i++) {
                    if (player.getRendererType(i) == trackType && selections.get(i) != null) {

                        selected = selections.get(i);
                    }
                }

                final List<TrackGroup> filtered = new ArrayList<>();
                final List<Integer> indexes = new ArrayList<>();

                for (int i = 0; i < tracks.length; i++) {
                    TrackGroup group = tracks.get(i);
                    if (!filtered.contains(group)) {
                        filtered.add(group);
                        indexes.add(i);
                    }
                }

                //Log.e(DcePlayerModel.class.getName(), "filtered = " + filtered.size() + " indexes = " + indexes);

                for (int i = 0; i < filtered.size(); i++) {
                    TrackGroup group = filtered.get(i);

                    boolean isSelected = selected != null && tracks.indexOf(selected.getTrackGroup()) == indexes.get(i);

                    Format format = group.getFormat(0);

                    String language = format != null ? format.language : context.getString(R.string.dce_tracks_unknown);
                    String languageLabel = language != null ? new Locale(language.replaceAll("_", "-")).getDisplayName() : "";

                    Log.d(DcePlayerModel.class.getName(), " group =  " + languageLabel + " selected = " + isSelected + " format = " + format.toString());

                    ret.add(new DceTrack(languageLabel, indexes.get(i), isSelected));
                }
            }
        }

        return ret;
    }

    private void selectTracks(int trackType, List<DceTrack> tracks) {
        final int index = findTrackTypeAvailable(trackType);

        if (index >= 0) {
            ParametersBuilder parametersBuilder = trackSelector.buildUponParameters();

            final TrackGroupArray groups = trackSelector.getCurrentMappedTrackInfo().getTrackGroups(index);

            ArrayList<Integer> trackIndexes = new ArrayList<>();

            int selected = -1;

            for (int i = 0; i < tracks.size(); i++) {
                final DceTrack track = tracks.get(i);
                if (track.isSelected()) {
                    selected = track.getIndex();
                }
            }

            if (selected >= 0) {
                parametersBuilder.setSelectionOverride(index, groups, new SelectionOverride(selected, 0));
            } else {
                parametersBuilder.clearSelectionOverrides(index);
            }

            if (trackType == C.TRACK_TYPE_TEXT) { // enable/disable subtitles renderer
                parametersBuilder.setRendererDisabled(index, selected < 0);
            }

            trackSelector.setParameters(parametersBuilder);
        }
    }
}
