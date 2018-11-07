package com.imggaming.mux;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.graphics.Point;
import android.view.View;

import com.google.android.exoplayer2.SimpleExoPlayer;
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.muxstats.MuxStatsExoPlayer;

import java.util.Map;

public class MuxStats {

    private final Context context;
    private MuxStatsExoPlayer muxStatsExoPlayer;

    public MuxStats(Context context, SimpleExoPlayer player, Map<String, Object> muxData) {
        this.context = context;

        final MuxData data = new MuxData(muxData);
        final CustomerPlayerData customerPlayerData = data.getCustomerPlayerData();

        if (customerPlayerData != null) {
            muxStatsExoPlayer = new MuxStatsExoPlayer(context, player, MuxData.MUX_PLAYER_NAME, customerPlayerData, data.getMuxVideoData());
        }
    }

    public void setVideoData(Map<String, Object> muxData) {
        if (muxStatsExoPlayer != null) {
            final MuxData data = new MuxData(muxData);
            muxStatsExoPlayer.videoChange(data.getMuxVideoData());
        }
    }


    public void setVideoView(View view) {
        if (muxStatsExoPlayer != null) {
            muxStatsExoPlayer.setPlayerView(view);
            setMuxStatsScreenSize();
        }
    }

    public void release() {
        if (muxStatsExoPlayer != null) {
            muxStatsExoPlayer.release();
            muxStatsExoPlayer = null;
        }
    }

    private void setMuxStatsScreenSize() {
        if (muxStatsExoPlayer != null) {
            final Activity activity = getActivity();
            if (activity != null) {
                Point size = new Point();
                activity.getWindowManager().getDefaultDisplay().getSize(size);
                muxStatsExoPlayer.setScreenSize(size.x, size.y);
            }
        }
    }

    private Activity getActivity() {
        Context context = this.context;
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) {
                return (Activity)context;
            }
            context = ((ContextWrapper)context).getBaseContext();
        }
        return null;
    }
}
