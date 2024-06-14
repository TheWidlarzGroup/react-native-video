package com.brentvatne.exoplayer;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.media3.common.AdViewProvider;
import androidx.media3.common.C;
import androidx.media3.common.Format;
import androidx.media3.common.Player;
import androidx.media3.common.Tracks;
import androidx.media3.common.VideoSize;
import androidx.media3.common.text.Cue;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import androidx.media3.ui.SubtitleView;

import android.graphics.Color;
import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;

import com.brentvatne.common.api.SubtitleStyle;
import com.google.common.collect.ImmutableList;

import java.util.List;

public final class ExoPlayerView extends PlayerView implements AdViewProvider {

    //private View surfaceView;
    private final ComponentListener componentListener;
    private ExoPlayer player;
    private final Context context;
    private final ViewGroup.LayoutParams layoutParams;

    private boolean useTextureView = true;
    private boolean useSecureView = false;
    private boolean hideShutterView = false;

    public ExoPlayerView(Context context) {
        this(context, null);
    }

    public ExoPlayerView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public ExoPlayerView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        this.context = context;

        layoutParams = new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);

        componentListener = new ComponentListener();
        setBackgroundColor(Color.BLACK);

        updateSurfaceView();
        requestLayout();
    }

    private void clearVideoView() {
        View surfaceView = this.getVideoSurfaceView();
        if (surfaceView instanceof TextureView) {
            player.clearVideoTextureView((TextureView) surfaceView);
        } else if (surfaceView instanceof SurfaceView) {
            player.clearVideoSurfaceView((SurfaceView) surfaceView);
        }
    }

    public boolean isPlaying() {
        return player != null && player.isPlaying();
    }

    public void setSubtitleStyle(SubtitleStyle style) {
        // ensure we reset subtile style before reapplying it
        SubtitleView subtitleLayout = getSubtitleView();
        subtitleLayout.setUserDefaultStyle();
        subtitleLayout.setUserDefaultTextSize();

        if (style.getFontSize() > 0) {
            subtitleLayout.setFixedTextSize(TypedValue.COMPLEX_UNIT_SP, style.getFontSize());
        }
        subtitleLayout.setPadding(style.getPaddingLeft(), style.getPaddingTop(), style.getPaddingRight(), style.getPaddingBottom());
        if (style.getOpacity() != 0) {
            subtitleLayout.setAlpha(style.getOpacity());
            subtitleLayout.setVisibility(View.VISIBLE);
        } else {
            subtitleLayout.setVisibility(View.GONE);
        }

    }

    private void updateSurfaceView() {
        View view;
        if (!useTextureView || useSecureView) {
            view = new SurfaceView(context);
            if (useSecureView) {
                ((SurfaceView)view).setSecure(true);
            }
        } else {
            setUseTextureView(true);
            view = new TextureView(context);
            // Support opacity properly:
            ((TextureView) view).setOpaque(false);
        }
        view.setLayoutParams(layoutParams);
        addView(view, 0, layoutParams);
    }

    private void updateShutterViewVisibility() {
        //((PlayerView)this).setHideShutterView(hideShutterView);
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(measureAndLayout);
    }

    // AdsLoader.AdViewProvider implementation.

    /**
     * Set the {@link ExoPlayer} to use. The {@link ExoPlayer#addListener} method of the
     * player will be called and previous
     * assignments are overridden.
     *
     * @param player The {@link ExoPlayer} to use.
     */
    public void setPlayer(ExoPlayer player) {
        if (this.player == player) {
            return;
        }
        if (this.player != null) {
            this.player.removeListener(componentListener);
            clearVideoView();
        }
        this.player = player;
        ((PlayerView)this).setPlayer(player);
        setHideShutterView(this.hideShutterView);
        if (player != null) {
            player.addListener(componentListener);
        }
        requestLayout();
    }

    public void setUseTextureView(boolean useTextureView) {
        if (useTextureView != this.useTextureView) {
            this.useTextureView = useTextureView;
            updateSurfaceView();
        }
    }

    public void useSecureView(boolean useSecureView) {
        if (useSecureView != this.useSecureView) {
            this.useSecureView = useSecureView;
            updateSurfaceView();
        }
    }

    public void setHideShutterView(boolean hideShutterView) {
        this.hideShutterView = hideShutterView;
        updateShutterViewVisibility();
    }

    private final Runnable measureAndLayout = () -> {
        measure(
                MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
        layout(getLeft(), getTop(), getRight(), getBottom());
    };

    private void updateForCurrentTrackSelections(Tracks tracks) {
        if (tracks == null) {
            return;
        }
        ImmutableList<Tracks.Group> groups = tracks.getGroups();
        for (Tracks.Group group: groups) {
            if (group.getType() == C.TRACK_TYPE_VIDEO && group.length > 0) {
                // get the first track of the group to identify aspect ratio
                Format format = group.getTrackFormat(0);

                // update aspect ratio !
                // layout.setAspectRatio(format.height == 0 ? 1 : (format.width * format.pixelWidthHeightRatio) / format.height);
                return;
            }
        }
        // no video tracks, in that case refresh shutterView visibility
        setHideShutterView(hideShutterView);
    }

    public void invalidateAspectRatio() {
        // Resetting aspect ratio will force layout refresh on next video size changed
        //layout.invalidateAspectRatio();
    }

    private final class ComponentListener implements Player.Listener {

        @Override
        public void onCues(@NonNull List<Cue> cues) {
            getSubtitleView().setCues(cues);
        }

        @Override
        public void onVideoSizeChanged(VideoSize videoSize) {
            /*
            boolean isInitialRatio = layout.getAspectRatio() == 0;
            if (videoSize.height == 0 || videoSize.width == 0) {
                // When changing video track we receive an ghost state with height / width = 0
                // No need to resize the view in that case
                return;
            }
            layout.setAspectRatio((videoSize.width * videoSize.pixelWidthHeightRatio) / videoSize.height);

            // React native workaround for measuring and layout on initial load.
            if (isInitialRatio) {
                post(measureAndLayout);
            }*/
        }

        @Override
        public void onRenderedFirstFrame() {
            setHideShutterView(hideShutterView);
        }

        @Override
        public void onTracksChanged(@NonNull Tracks tracks) {
            //updateForCurrentTrackSelections(tracks);
        }
    }
}
