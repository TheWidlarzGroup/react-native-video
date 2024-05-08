package com.brentvatne.exoplayer;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.media3.common.AdViewProvider;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import androidx.media3.common.Tracks;
import androidx.media3.common.VideoSize;
import androidx.media3.common.text.Cue;
import androidx.media3.common.util.Assertions;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.trackselection.TrackSelectionArray;
import androidx.media3.ui.SubtitleView;

import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.brentvatne.common.api.ResizeMode;
import com.brentvatne.common.api.SubtitleStyle;

import java.util.List;

public final class ExoPlayerView extends FrameLayout implements AdViewProvider {

    private View surfaceView;
    private final View shutterView;
    private final SubtitleView subtitleLayout;
    private final AspectRatioFrameLayout layout;
    private final ComponentListener componentListener;
    private ExoPlayer player;
    final private Context context;
    final private ViewGroup.LayoutParams layoutParams;
    private final FrameLayout adOverlayFrameLayout;

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

        FrameLayout.LayoutParams aspectRatioParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        aspectRatioParams.gravity = Gravity.CENTER;
        layout = new AspectRatioFrameLayout(context);
        layout.setLayoutParams(aspectRatioParams);

        shutterView = new View(getContext());
        shutterView.setLayoutParams(layoutParams);
        shutterView.setBackgroundColor(ContextCompat.getColor(context, android.R.color.black));

        subtitleLayout = new SubtitleView(context);
        subtitleLayout.setLayoutParams(layoutParams);
        subtitleLayout.setUserDefaultStyle();
        subtitleLayout.setUserDefaultTextSize();

        updateSurfaceView();

        adOverlayFrameLayout = new FrameLayout(context);

        layout.addView(shutterView, 1, layoutParams);
        layout.addView(subtitleLayout, 2, layoutParams);
        layout.addView(adOverlayFrameLayout, 3, layoutParams);

        addViewInLayout(layout, 0, aspectRatioParams);
    }

    private void clearVideoView() {
        if (surfaceView instanceof TextureView) {
            player.clearVideoTextureView((TextureView) surfaceView);
        } else if (surfaceView instanceof SurfaceView) {
            player.clearVideoSurfaceView((SurfaceView) surfaceView);
        }
    }

    private void setVideoView() {
        if (surfaceView instanceof TextureView) {
            player.setVideoTextureView((TextureView) surfaceView);
        } else if (surfaceView instanceof SurfaceView) {
            player.setVideoSurfaceView((SurfaceView) surfaceView);
        }
    }

    public boolean isPlaying() {
        return player != null && player.isPlaying();
    }

    public void setSubtitleStyle(SubtitleStyle style) {
        // ensure we reset subtitle style before reapplying it
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

    public void setShutterColor(Integer color) {
        shutterView.setBackgroundColor(color);
    }

    private void updateSurfaceView() {
        View view;
        if (!useTextureView || useSecureView) {
            view = new SurfaceView(context);
            if (useSecureView) {
                ((SurfaceView)view).setSecure(true);
            }
        } else {
            view = new TextureView(context);
            // Support opacity properly:
            ((TextureView) view).setOpaque(false);
        }
        view.setLayoutParams(layoutParams);

        surfaceView = view;
        if (layout.getChildAt(0) != null) {
            layout.removeViewAt(0);
        }
        layout.addView(surfaceView, 0, layoutParams);

        if (this.player != null) {
            setVideoView();
        }
    }

    private void updateShutterViewVisibility() {
        shutterView.setVisibility(this.hideShutterView ? View.INVISIBLE : View.VISIBLE);
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(measureAndLayout);
    }

    // AdsLoader.AdViewProvider implementation.

    @Override
    public ViewGroup getAdViewGroup() {
        return Assertions.checkNotNull(adOverlayFrameLayout, "exo_ad_overlay must be present for ad playback");
    }

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
        shutterView.setVisibility(this.hideShutterView ? View.INVISIBLE : View.VISIBLE);
        if (player != null) {
            setVideoView();
            player.addListener(componentListener);
        }
    }

    /**
     * Sets the resize mode which can be of value {@link ResizeMode.Mode}
     *
     * @param resizeMode The resize mode.
     */
    public void setResizeMode(@ResizeMode.Mode int resizeMode) {
        if (layout.getResizeMode() != resizeMode) {
            layout.setResizeMode(resizeMode);
            post(measureAndLayout);
        }
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

    private void updateForCurrentTrackSelections() {
        if (player == null) {
            return;
        }
        TrackSelectionArray selections = player.getCurrentTrackSelections();
        for (int i = 0; i < selections.length; i++) {
            if (player.getRendererType(i) == C.TRACK_TYPE_VIDEO && selections.get(i) != null) {
                // Video enabled so artwork must be hidden. If the shutter is closed, it will be opened in
                // onRenderedFirstFrame().
                return;
            }
        }
        // Video disabled so the shutter must be closed.
        shutterView.setVisibility(this.hideShutterView ? View.INVISIBLE : View.VISIBLE);
    }

    Runnable hideShutterViewRunnable = new Runnable() {
        @Override
        public void run() {
            shutterView.setVisibility(INVISIBLE);
        }
    };

    public void invalidateAspectRatio() {
        // Resetting aspect ratio will force layout refresh on next video size changed
        layout.invalidateAspectRatio();

        removeCallbacks(hideShutterViewRunnable);
    }

    private final class ComponentListener implements Player.Listener {

        @Override
        public void onCues(@NonNull List<Cue> cues) {
            subtitleLayout.setCues(cues);
        }

        @Override
        public void onVideoSizeChanged(VideoSize videoSize) {
            boolean isInitialRatio = layout.getAspectRatio() == 0;
            layout.setAspectRatio(videoSize.height == 0 ? 1 : (videoSize.width * videoSize.pixelWidthHeightRatio) / videoSize.height);

            // React native workaround for measuring and layout on initial load.
            if (isInitialRatio) {
                post(measureAndLayout);
            }
        }

        @Override
        public void onRenderedFirstFrame() {
            // The shutter view is use to hide dirty resizing issue when starting playback.
            // In case video doesn't match your View aspect ratio, at playback startup you may have flickering during resize.
            // we saw that onRenderedFirstFrame is called before first resizing
            // Then hiding the shutterView directly may not hide the flickering.
            // This small delay avoid the flickering
            postDelayed(hideShutterViewRunnable, 15);
        }

        @Override
        public void onTracksChanged(@NonNull Tracks tracks) {
            updateForCurrentTrackSelections();
        }
    }

}
