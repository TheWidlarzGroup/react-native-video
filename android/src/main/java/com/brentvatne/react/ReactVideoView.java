package com.brentvatne.react;

import android.content.Context;
import android.media.MediaPlayer;
import android.os.Handler;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;
import com.yqritc.scalablevideoview.ScalableVideoView;

public class ReactVideoView extends ScalableVideoView {

    private ThemedReactContext mThemedReactContext;

    private Handler mProgressUpdateHandler = new Handler();
    private Runnable mProgressUpdateRunnable = null;

    private ScalableType mResizeMode = ScalableType.LEFT_TOP;
    private boolean mRepeat = false;
    private boolean mPaused = false;
    private boolean mMuted = false;
    private float mVolume = 1;

    public ReactVideoView(ThemedReactContext themedReactContext) {
        super(themedReactContext);

        mThemedReactContext = themedReactContext;

        mMediaPlayer = new MediaPlayer();
        mMediaPlayer.setOnVideoSizeChangedListener(this);
        setSurfaceTextureListener(this);

        mProgressUpdateRunnable = new Runnable() {
            @Override
            public void run() {
                final RCTEventEmitter eventEmitter = getEventEmitter();

                if (mMediaPlayer.isPlaying()) {
                    WritableMap event = Arguments.createMap();
                    // TODO: Other event properties.
                    event.putDouble("currentTime", (double) mMediaPlayer.getCurrentPosition() / (double) 1000);
                    event.putDouble("duration", (double) mMediaPlayer.getDuration() / (double) 1000);
                    eventEmitter.receiveEvent(getId(), ReactVideoViewManager.EVENT_PROGRESS, event);
                }
                mProgressUpdateHandler.postDelayed(mProgressUpdateRunnable, 250);
            }
        };
        mProgressUpdateHandler.post(mProgressUpdateRunnable);
    }

    private RCTEventEmitter getEventEmitter() {
        return mThemedReactContext.getJSModule(RCTEventEmitter.class);
    }

    public void reset() {
        mMediaPlayer.reset();
    }

    public void setResizeModeModifier(final ScalableType resizeMode) {
        mResizeMode = resizeMode;
        setScalableType(resizeMode);
        invalidate();
    }

    public void setRepeatModifier(final boolean repeat) {
        mRepeat = repeat;
        setLooping(repeat);
    }

    public void setPausedModifier(final boolean paused) {
        mPaused = paused;

        try {
            if (!mPaused) {
                start();
            } else {
                pause();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setMutedModifier(final boolean muted) {
        mMuted = muted;

        if (mMuted) {
            setVolume(0, 0);
        } else {
            setVolume(mVolume, mVolume);
        }
    }

    public void setVolumeModifier(final float volume) {
        mVolume = volume;
        setMutedModifier(mMuted);
    }

    public void applyModifiers() {
        setResizeModeModifier(mResizeMode);
        setRepeatModifier(mRepeat);
        setPausedModifier(mPaused);
        setVolumeModifier(mVolume);
    }
}
