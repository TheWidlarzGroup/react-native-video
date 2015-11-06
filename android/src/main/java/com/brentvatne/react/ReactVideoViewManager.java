package com.brentvatne.react;

import android.content.Context;
import android.media.MediaPlayer;
import android.view.Gravity;
import android.widget.FrameLayout;
import android.support.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.yqritc.scalablevideoview.ScalableType;
import com.yqritc.scalablevideoview.ScalableVideoView;

import java.util.Map;

import static junit.framework.Assert.assertTrue;

public class ReactVideoViewManager extends SimpleViewManager<FrameLayout> {

    public static final String REACT_CLASS = "RCTVideo";
    private static final String PROP_SRC = "src";
    private static final String PROP_RESIZE_MODE = "resizeMode";
    private static final String PROP_REPEAT = "repeat";
    private static final String PROP_PAUSED = "paused";
    private static final String PROP_MUTED = "muted";
    private static final String PROP_VOLUME = "volume";

    private boolean mPrepared = false;

    private ScalableType mResizeMode = ScalableType.LEFT_TOP;
    private boolean mRepeat = false;
    private boolean mPaused = false;
    private boolean mMuted = false;
    private float mVolume = 1;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected FrameLayout createViewInstance(ThemedReactContext themedReactContext) {
        final FrameLayout container = new FrameLayout(themedReactContext);
        final ScalableVideoView videoView = new ScalableVideoView(themedReactContext);

        final FrameLayout.LayoutParams videoLayout = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        );
        videoLayout.gravity = Gravity.CENTER;
        videoView.setLayoutParams(videoLayout);

        container.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        container.addView(videoView);
        return container;
    }

    @Override
    @Nullable
    public Map getExportedViewConstants() {
        return MapBuilder.of(
                "ScaleNone", ScalableType.LEFT_TOP.ordinal(),
                "ScaleToFill", ScalableType.FIT_XY.ordinal(),
                "ScaleAspectFit", ScalableType.FIT_CENTER.ordinal(),
                "ScaleAspectFill", ScalableType.CENTER_CROP.ordinal()
        );
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(final FrameLayout container, @Nullable ReadableMap src) {
        final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);

        try {
            final String uriString = src.getString("uri");
            final boolean isNetwork = src.getBoolean("isNetwork");

            if (mPrepared) {
                videoView.stop();
                mPrepared = false;
            }

            if (isNetwork) {
                videoView.setDataSource(uriString);
            } else {
                Context context = videoView.getContext();
                videoView.setRawData(context.getResources().getIdentifier(uriString, "raw", context.getPackageName()));
            }

            videoView.prepare(new MediaPlayer.OnPreparedListener() {
                @Override
                public void onPrepared(MediaPlayer mp) {
                    mPrepared = true;
                    applyModifiers(container);
                }
            });
        } catch (Exception e) {
            assertTrue("failed to set video source", false);
        }
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final FrameLayout container, final int resizeModeOrdinal) {
        mResizeMode = ScalableType.values()[resizeModeOrdinal];

        if (mPrepared) {
            final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);
            videoView.setScalableType(mResizeMode);
            videoView.invalidate();
        }
    }

    @ReactProp(name = PROP_REPEAT)
    public void setRepeat(final FrameLayout container, final boolean repeat) {
        mRepeat = repeat;

        if (mPrepared) {
            final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);
            videoView.setLooping(mRepeat);
        }
    }

    @ReactProp(name = PROP_PAUSED)
    public void setPaused(final FrameLayout container, final boolean paused) {
        mPaused = paused;

        if (mPrepared) {
            final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);
            videoView.requestFocus();
            if (!mPaused) {
                videoView.start();
            } else {
                videoView.pause();
            }
        }
    }

    @ReactProp(name = PROP_MUTED)
    public void setMuted(final FrameLayout container, final boolean muted) {
        mMuted = muted;

        if (mPrepared) {
            final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);

            if (mMuted) {
                videoView.setVolume(0, 0);
            } else {
                videoView.setVolume(mVolume, mVolume);
            }
        }
    }

    @ReactProp(name = PROP_VOLUME)
    public void setVolume(final FrameLayout container, final float volume) {
        mVolume = volume;

        if (mPrepared) {
            final ScalableVideoView videoView = (ScalableVideoView) container.getChildAt(0);
            videoView.setVolume(mVolume, mVolume);
        }
    }

    private void applyModifiers(final FrameLayout container) {
        setResizeMode(container, mResizeMode.ordinal());
        setRepeat(container, mRepeat);
        setPaused(container, mPaused);
        setMuted(container, mMuted);
    }
}
