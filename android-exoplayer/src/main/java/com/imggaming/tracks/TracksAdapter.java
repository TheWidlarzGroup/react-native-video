package com.imggaming.tracks;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.CheckedTextView;
import android.widget.ListView;
import android.widget.TextView;

import com.brentvatne.react.R;
import com.imggaming.tracks.DcePlayerModel.DceTrack;
import com.imggaming.utils.DrawableUtils;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

class TracksAdapter extends BaseAdapter {

    private final List<Object> tracks;
    private final Context context;
    private int accentColor;

    public TracksAdapter(Context context, List<Object> tracks) {
        this.context = context;
        this.tracks = tracks;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {

        Object data = getItem(position);

        if (isHeader(position)) {
            if (convertView instanceof CheckedTextView || !(convertView instanceof TextView)) {
                convertView = LayoutInflater.from(context).inflate(R.layout.dce_tracks_header, parent, false);
            }

            TextView textView = (TextView) convertView;

            DceHeader header = (DceHeader) data;
            textView.setText(header.getResId());
            textView.setTextColor(accentColor);



        } else {
            if (!(convertView instanceof CheckedTextView)) {
                convertView = LayoutInflater.from(context).inflate(R.layout.dce_tracks_item, parent, false);
            }

            CheckedTextView textView = (CheckedTextView) convertView;

            DceTrack track = (DceTrack) data;
            textView.setText(track.getName());
            textView.setChecked(track.isSelected());

            DrawableUtils.setTint(textView.getCheckMarkDrawable(), accentColor);
        }

        return convertView;
    }

    public void initSelections(ListView list) {
        for (int i = 0; i < tracks.size(); i++) {
            Object data = tracks.get(i);
            if (data instanceof DceTrack) {
                list.setItemChecked(i, ((DceTrack)data).isSelected());
            } else {
                list.setItemChecked(i, false);
            }
        }
    }

    @Override
    public int getCount() {
        return tracks != null ? tracks.size() : 0;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public Object getItem(int position) {
        return tracks.get(position);
    }

    private boolean isHeader(int position) {
        return tracks != null && tracks.get(position) instanceof DceHeader;
    }

    @Override
    public int getItemViewType(int position) {
        if (isHeader(position)) {
            return 0;
        } else {
            return 1;
        }
    }

    @Override
    public boolean areAllItemsEnabled() {
        return false;
    }

    @Override
    public boolean isEnabled(final int position) {
        return !isHeader(position);
    }

    public List<Object> getTracks() {
        return tracks;
    }

    public void setAccentColor(int accentColor) {
        this.accentColor = accentColor;
    }
}
