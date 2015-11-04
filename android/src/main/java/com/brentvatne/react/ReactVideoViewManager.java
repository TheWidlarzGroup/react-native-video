package com.brentvatne.react;

import android.graphics.Color;
import android.media.MediaPlayer;
import android.widget.MediaController;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.widget.FrameLayout;
import android.widget.VideoView;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

import java.util.Map;

import static junit.framework.Assert.assertTrue;

public class ReactVideoViewManager extends SimpleViewManager<FrameLayout> {

    public static final String REACT_CLASS = "RCTVideo";
    private static final String PROP_SRC = "src";
    private static final String PROP_RESIZE_MODE = "resizeMode";
    private static final String PROP_REPEAT = "repeat";
    private static final String PROP_PAUSED = "paused";

    private enum ResizeMode {
        SCALE_NONE, SCALE_TO_FILL, SCALE_ASPECT_FIT, SCALE_ASPECT_FILL
    }

    private boolean mRepeat = false;
    private boolean mPaused = false;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected FrameLayout createViewInstance(ThemedReactContext themedReactContext) {
        final FrameLayout container = new FrameLayout(themedReactContext);
        final VideoView videoView = new VideoView(themedReactContext);

        MediaController mediaController = new MediaController(themedReactContext);
        mediaController.setAnchorView(videoView);
        mediaController.setVisibility(VideoView.GONE);
        videoView.setMediaController(mediaController);
        videoView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        container.addView(videoView);

        return container;
    }

    @Override
    public
    @Nullable
    Map getExportedViewConstants() {
        return MapBuilder.of(
                "ScaleNone", ResizeMode.SCALE_NONE.ordinal(),
                "ScaleToFill", ResizeMode.SCALE_TO_FILL.ordinal(),
                "ScaleAspectFit", ResizeMode.SCALE_ASPECT_FIT.ordinal(),
                "ScaleAspectFill", ResizeMode.SCALE_ASPECT_FILL.ordinal());
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(final FrameLayout container, @Nullable ReadableMap src) {
        final VideoView videoView = (VideoView) container.getChildAt(0);

        try {
            final String uriString = src.getString("uri");
            final boolean isNetwork = src.getBoolean("isNetwork");

            videoView.stopPlayback();

            if (isNetwork) {
                videoView.setVideoPath(uriString);
                videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                    @Override
                    public void onPrepared(MediaPlayer mp) {
                       applyModifiers(container);
                    }
                });
            } else {
                videoView.setVideoURI(Uri.parse("android.resource://" + videoView.getContext().getPackageName() +
                        "/raw/" + uriString));
                applyModifiers(container);
            }
        } catch (Exception e) {
            assertTrue("failed to set video source", false);
        }
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final FrameLayout container, int resizeModeOrdinal) {
        final VideoView videoView = (VideoView) container.getChildAt(0);

        try {
            final ResizeMode resizeMode = ResizeMode.values()[resizeModeOrdinal];

            FrameLayout.LayoutParams layoutParams = null;
            switch (resizeMode) {
                case SCALE_NONE:
                    layoutParams = new FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.WRAP_CONTENT,
                            FrameLayout.LayoutParams.WRAP_CONTENT);
                    break;

                case SCALE_TO_FILL:
                    layoutParams = new FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT);
                    break;

                case SCALE_ASPECT_FIT:
                    break;

                case SCALE_ASPECT_FILL:
                    break;
            }

            if (layoutParams != null) {
                videoView.setLayoutParams(layoutParams);
                container.updateViewLayout(videoView, layoutParams);
            }
        } catch (Exception e) {
            assertTrue("failed to set video resize mode", false);
        }
    }

    @ReactProp(name = PROP_REPEAT)
    public void setRepeat(final FrameLayout container, final boolean repeat) {
        mRepeat = repeat;

        if (!mRepeat) { return; }

        final VideoView videoView = (VideoView) container.getChildAt(0);
        videoView.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
            @Override
            public void onCompletion(MediaPlayer mp) {

                if (mRepeat) {
                    mp.seekTo(0);
                    setPaused(container, mPaused);
                }
            }
        });
    }

    @ReactProp(name = PROP_PAUSED)
    public void setPaused(final FrameLayout container, final boolean paused) {
        final VideoView videoView = (VideoView) container.getChildAt(0);
        videoView.requestFocus();
        if (!paused) {
            videoView.start();
        } else {
            videoView.pause();
        }
        mPaused = paused;
    }

    private void applyModifiers(final FrameLayout container) {
        setRepeat(container, mRepeat);
        setPaused(container, mPaused);
    }
}
