package com.imggaming.tracks;

import android.content.Context;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ListView;

import com.brentvatne.react.R;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;

public class DceTracksDialog extends AlertDialog {
    private DcePlayerModel model;
    private int accentColor;

    public DceTracksDialog(@NonNull Context context) {
        super(context);
    }

    public DceTracksDialog(@NonNull Context context, int themeResId) {
        super(context, themeResId);
    }

    protected DceTracksDialog(@NonNull Context context, boolean cancelable, @Nullable OnCancelListener cancelListener) {
        super(context, cancelable, cancelListener);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (model == null) {
            throw new RuntimeException("Model cannot be null");
        }

        createViews();
    }

    private void createViews() {
        final ViewGroup layout = (ViewGroup) getLayoutInflater().inflate(R.layout.dce_tracks_dialog, null);

        setContentView(layout);

        DisplayMetrics displaymetrics = new DisplayMetrics();

        getWindow().getWindowManager().getDefaultDisplay().getMetrics(displaymetrics);
        getWindow().setGravity(Gravity.RIGHT | Gravity.TOP);
        getWindow().setLayout(displaymetrics.widthPixels / 3, ViewGroup.LayoutParams.MATCH_PARENT);
        layout.getLayoutParams().height = ViewGroup.LayoutParams.MATCH_PARENT;


        final List<DcePlayerModel.DceTrack> subtitles =  model.getSubtitles();
        final List<DcePlayerModel.DceTrack> audio = model.getAudioTracks();

        final ArrayList<Object> data = new ArrayList<>();
        if (model.areSubtitlesAvailable()) {
            data.add(new DceHeader(R.string.dce_tracks_dialog_subtitles));
            data.addAll(subtitles);
        }
        if (audio.size() > 1) {
            data.add(new DceHeader(R.string.dce_tracks_dialog_audio));
            data.addAll(audio);
        }

        final TracksAdapter adapter = new TracksAdapter(getContext(), data);
        adapter.setAccentColor(accentColor);

        final ListView list = findViewById(R.id.dce_tracks_list);
        list.setChoiceMode(ListView.CHOICE_MODE_MULTIPLE);
        list.setAdapter(adapter);

        adapter.initSelections(list);

        list.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {

                Object track = data.get(position);

                if (audio.contains(track)) {
                    for (DcePlayerModel.DceTrack audioTrack: audio) {
                        audioTrack.setSelected(audioTrack == track);
                    }
                    model.setAudioTracks(audio);
                }

                if (subtitles.contains(track)) {
                    for (DcePlayerModel.DceTrack subtitlesTrack: subtitles) {
                        subtitlesTrack.setSelected(subtitlesTrack == track);
                    }
                    model.setSubtitles(subtitles);
                }

                adapter.initSelections(list);
                adapter.notifyDataSetChanged();

                list.post(new Runnable() {
                    @Override
                    public void run() {
                        dismiss();
                    }
                });
            }
        });
    }

    public void setModel(DcePlayerModel model) {
        this.model = model;
    }

    public void setAccentColor(int accentColor) {
        this.accentColor = accentColor;
    }
}
