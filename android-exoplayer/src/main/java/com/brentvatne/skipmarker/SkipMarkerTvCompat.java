package com.brentvatne.skipmarker;

import static androidx.media3.common.Player.COMMAND_SEEK_FORWARD;

import android.os.Handler;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.ui.PlayerControlView;

import com.brentvatne.react.R;
import com.diceplatform.doris.custom.ui.entity.marker.SkipMarker;

import java.util.List;
import java.util.Map;

public class SkipMarkerTvCompat implements View.OnClickListener, Player.Listener, PlayerControlView.VisibilityListener {
    private final TextView skipMarkTextView;
    private Player player;
    private List<SkipMarker> skipMarkerList;
    private Map<SkipMarker.Type, String> labels;
    private final float density;

    private final Handler handler = new Handler();

    private final Runnable positionRunnable = this::emmitPosition;

    public SkipMarkerTvCompat(ViewGroup viewGroup) {
        this.skipMarkTextView = viewGroup.findViewById(R.id.skipMarkTextView);
        if (skipMarkTextView != null) {
            skipMarkTextView.setOnClickListener(this);
        }
        density = viewGroup.getResources().getDisplayMetrics().density;
    }

    public void setSkipMarkList(List<SkipMarker> list) {
        this.skipMarkerList = list;
    }

    public void setLabels(Map<SkipMarker.Type, String> labels) {
        this.labels = labels;
    }

    public void setPlayer(@Nullable Player player, @Nullable PlayerControlView playerControlView) {
        if (this.player != null) {
            this.player.removeListener(this);
        }
        this.player = player;
        if (player != null) {
            player.addListener(this);
        }
        if (playerControlView != null) {
            playerControlView.addVisibilityListener(this);
        }
    }

    @Override
    public void onClick(View v) {
        SkipMarker skipMarker = (SkipMarker) v.getTag();
        if (player == null || skipMarker == null) return;
        if (player.getPlaybackState() != Player.STATE_ENDED
                && player.isCommandAvailable(COMMAND_SEEK_FORWARD)) {
            player.seekTo(skipMarker.endTimeMs);
        }
    }

    @Override
    public void onVisibilityChange(int visibility) {
        if (skipMarkTextView == null) return;
        FrameLayout.LayoutParams layoutParams = (FrameLayout.LayoutParams) skipMarkTextView.getLayoutParams();
        if (visibility == View.VISIBLE) {
            layoutParams.bottomMargin = (int) (160 * density);
        } else {
            layoutParams.bottomMargin = (int) (24 * density);
        }
        skipMarkTextView.setLayoutParams(layoutParams);
    }

    @Override
    public void onEvents(@NonNull Player player, @NonNull Player.Events events) {
        if (events.contains(Player.EVENT_POSITION_DISCONTINUITY)) {
            updateSkipMarker(player.getCurrentPosition());
        }
    }

    @Override
    public void onIsPlayingChanged(boolean isPlaying) {
        if (isPlaying) {
            startEmittingPosition();
        } else {
            stopEmittingPosition();
        }
    }

    @Override
    public void onPlayerErrorChanged(@Nullable PlaybackException error) {
        stopEmittingPosition();
        skipMarkTextView.setVisibility(View.INVISIBLE);
    }

    private void updateSkipMarker(long currentPosition) {
        if (skipMarkTextView == null || skipMarkerList == null || skipMarkerList.isEmpty()) return;
        SkipMarker skipMarker = null;
        for (SkipMarker item : skipMarkerList) {
            if (currentPosition >= item.startTimeMs && currentPosition < item.endTimeMs) {
                skipMarker = item;
                break;
            }
        }
        if (skipMarker != null) {
            skipMarkTextView.setTag(skipMarker);
            skipMarkTextView.setText(getSkipMarkerLabel(skipMarker.skipMarkerType));
            skipMarkTextView.setVisibility(View.VISIBLE);
        } else {
            skipMarkTextView.setVisibility(View.INVISIBLE);
        }
    }

    private String getSkipMarkerLabel(SkipMarker.Type type) {
        if (labels == null || labels.isEmpty() || !labels.containsKey(type)) return type.name();
        return labels.get(type);
    }

    private void startEmittingPosition() {
        stopEmittingPosition();
        if (player == null) {
            return;
        }
        handler.post(positionRunnable);
    }

    private void stopEmittingPosition() {
        handler.removeCallbacks(positionRunnable);
    }

    private void emmitPosition() {
        stopEmittingPosition();
        if (player == null) {
            return;
        }
        updateSkipMarker(player.getCurrentPosition());
        handler.postDelayed(positionRunnable, 1000);
    }
}
