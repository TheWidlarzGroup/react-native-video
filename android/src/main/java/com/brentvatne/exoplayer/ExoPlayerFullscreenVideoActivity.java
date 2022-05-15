package com.brentvatne.exoplayer;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.brentvatne.react.R;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.ui.PlayerControlView;

public class ExoPlayerFullscreenVideoActivity extends AppCompatActivity implements ReactExoplayerView.FullScreenDelegate {
    public static final String EXTRA_EXO_PLAYER_VIEW_ID = "extra_id";
    public static final String EXTRA_ORIENTATION = "extra_orientation";

    private ReactExoplayerView exoplayerView;
    private PlayerControlView playerControlView;
    private SimpleExoPlayer player;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        int exoplayerViewId = getIntent().getIntExtra(EXTRA_EXO_PLAYER_VIEW_ID, -1);
        exoplayerView = ReactExoplayerView.getViewInstance(exoplayerViewId);
        if (exoplayerView == null) {
            finish();
            return;
        }
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String orientation = getIntent().getStringExtra(EXTRA_ORIENTATION);
        if ("landscape".equals(orientation)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        } else if ("portrait".equals(orientation)) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
        }
        setContentView(R.layout.exo_player_fullscreen_video);
        player = exoplayerView.getPlayer();

        ExoPlayerView playerView = findViewById(R.id.player_view);
        playerView.setPlayer(player);
        playerView.setOnClickListener(v -> togglePlayerControlVisibility());

        playerControlView = findViewById(R.id.player_controls);
        playerControlView.setPlayer(player);
        // Set the fullscreen button to "close fullscreen" icon
        ImageView fullscreenIcon = playerControlView.findViewById(R.id.exo_fullscreen_icon);
        fullscreenIcon.setImageResource(R.drawable.exo_controls_fullscreen_exit);
        playerControlView.findViewById(R.id.exo_fullscreen_button)
                .setOnClickListener(v -> {
                    if (exoplayerView != null) {
                        exoplayerView.setFullscreen(false);
                    }
                });
        //Handling the playButton click event
        playerControlView.findViewById(R.id.exo_play).setOnClickListener(v -> {
            if (player != null && player.getPlaybackState() == Player.STATE_ENDED) {
                player.seekTo(0);
            }
            if (exoplayerView != null) {
                exoplayerView.setPausedModifier(false);
            }
        });

        //Handling the pauseButton click event
        playerControlView.findViewById(R.id.exo_pause).setOnClickListener(v -> {
            if (exoplayerView != null) {
                exoplayerView.setPausedModifier(true);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (exoplayerView != null) {
            exoplayerView.syncPlayerState();
            exoplayerView.registerFullScreenDelegate(this);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        player.setPlayWhenReady(false);
        if (exoplayerView != null) {
            exoplayerView.registerFullScreenDelegate(null);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            playerControlView.postDelayed(this::hideSystemUI, 200);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK)) {
            if (exoplayerView != null) {
                exoplayerView.setFullscreen(false);
                return false;
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
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
