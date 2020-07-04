package com.brentvatne.exoplayer;

import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.brentvatne.react.R;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.ui.PlayerControlView;

public class ExoPlayerFullscreenVideoActivity extends AppCompatActivity implements ReactExoplayerView.FullScreenDelegate {
    public static final String EXTRA_ID = "extra_id";
    public static final String EXTRA_IS_PLAYING = "extra_is_playing";

    private int id;
    private PlayerControlView playerControlView;
    private SimpleExoPlayer player;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.exo_player_fullscreen_video);
        id = getIntent().getIntExtra(EXTRA_ID, -1);
        player = ReactExoplayerView.getViewInstance(id).getPlayer();

        ExoPlayerView playerView = findViewById(R.id.player_view);
        playerView.setPlayer(player);
        playerView.setOnClickListener(v -> togglePlayerControlVisibility());

        playerControlView = findViewById(R.id.player_controls);
        playerControlView.setPlayer(player);
        // Set the fullscreen button to "close fullscreen" icon
        ImageView fullscreenIcon = playerControlView.findViewById(R.id.exo_fullscreen_icon);
        fullscreenIcon.setImageResource(R.drawable.exo_controls_fullscreen_exit);
        playerControlView.findViewById(R.id.exo_fullscreen_button)
                .setOnClickListener(v -> finish());
    }

    @Override
    public void onResume() {
        super.onResume();
        boolean isPlaying = getIntent().getBooleanExtra(EXTRA_IS_PLAYING, false);
        player.setPlayWhenReady(isPlaying);
        ReactExoplayerView.getViewInstance(id).registerFullScreenDelegate(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        boolean isPlaying = player.getPlayWhenReady() && player.getPlaybackState() == Player.STATE_READY;
        ReactExoplayerView.getViewInstance(id).setPausedModifier(!isPlaying);
        player.setPlayWhenReady(false);
        ReactExoplayerView.getViewInstance(id).registerFullScreenDelegate(null);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    private void togglePlayerControlVisibility() {
        if (playerControlView.isVisible()) {
            playerControlView.hide();
        } else {
            playerControlView.show();
        }
    }

    /**
     * Enables regular immersive mode.
     */
    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE
                        // Set the content to appear under the system bars so that the
                        // content doesn't resize when the system bars hide and show.
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        // Hide the nav bar and status bar
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    /**
     * Shows the system bars by removing all the flags
     * except for the ones that make the content appear under the system bars.
     */
    private void showSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void closeFullScreen() {
        finish();
    }
}
