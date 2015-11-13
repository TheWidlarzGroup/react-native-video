package com.brentvatne.react;

import android.media.MediaPlayer;
import android.os.Handler;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;
import com.yqritc.scalablevideoview.ScalableVideoView;

import java.io.IOException;

public class ReactVideoView extends ScalableVideoView implements MediaPlayer.OnPreparedListener, MediaPlayer
        .OnErrorListener, MediaPlayer.OnCompletionListener {

    public enum Events {
        EVENT_LOAD_START("onVideoLoadStart"),
        EVENT_LOAD("onVideoLoad"),
        EVENT_ERROR("onVideoError"),
        EVENT_PROGRESS("onVideoProgress"),
        EVENT_SEEK("onVideoSeek"),
        EVENT_END("onVideoEnd");

        private final String mName;

        Events(final String name) {
            mName = name;
        }

        @Override
        public String toString() {
            return mName;
        }
    }

    private ThemedReactContext mThemedReactContext;
    private RCTEventEmitter mEventEmitter;

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
        mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

        initializeMediaPlayerIfNeeded();
        setSurfaceTextureListener(this);

        final MediaPlayer mediaPlayer = mMediaPlayer;

        mProgressUpdateRunnable = new Runnable() {
            @Override
            public void run() {

                try {
                    WritableMap event = Arguments.createMap();
                    // TODO: Other event properties.
                    event.putDouble("currentTime", (double) mediaPlayer.getCurrentPosition() / (double) 1000);
                    event.putDouble("duration", (double) mediaPlayer.getDuration() / (double) 1000);
                    event.putDouble("playableDuration", (double) mediaPlayer.getDuration() / (double) 1000);
                    mEventEmitter.receiveEvent(getId(), Events.EVENT_PROGRESS.toString(), event);
                } catch (Exception e) {
                    // Do nothing.
                }
                mProgressUpdateHandler.postDelayed(mProgressUpdateRunnable, 250);
            }
        };
        mProgressUpdateHandler.post(mProgressUpdateRunnable);
    }

    private void initializeMediaPlayerIfNeeded() {
        if (mMediaPlayer == null) {
            mMediaPlayer = new MediaPlayer();
            mMediaPlayer.setScreenOnWhilePlaying(true);
            mMediaPlayer.setOnVideoSizeChangedListener(this);
            mMediaPlayer.setOnErrorListener(this);
            mMediaPlayer.setOnPreparedListener(this);
            mMediaPlayer.setOnCompletionListener(this);
        }
    }

    public void setSrc(final String uriString, final boolean isNetwork) throws IOException {
        mMediaPlayer.reset();

        if (isNetwork) {
            setDataSource(uriString);
        } else {
            setRawData(mThemedReactContext.getResources().getIdentifier(
                    uriString,
                    "raw",
                    mThemedReactContext.getPackageName()
            ));
        }

        prepareAsync(this);
    }

    public void setResizeModeModifier(final ScalableType resizeMode) {
        mResizeMode = resizeMode;
        initializeMediaPlayerIfNeeded();
        setScalableType(resizeMode);
        invalidate();
    }

    public void setRepeatModifier(final boolean repeat) {
        mRepeat = repeat;
        initializeMediaPlayerIfNeeded();
        setLooping(repeat);
    }

    public void setPausedModifier(final boolean paused) {
        mPaused = paused;

        try {
            initializeMediaPlayerIfNeeded();

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

        initializeMediaPlayerIfNeeded();

        if (mMuted) {
            setVolume(0, 0);
        } else {
            setVolume(mVolume, mVolume);
        }
    }

    public void setVolumeModifier(final float volume) {
        mVolume = volume;
        initializeMediaPlayerIfNeeded();
        setMutedModifier(mMuted);
    }

    public void applyModifiers() {
        setResizeModeModifier(mResizeMode);
        setRepeatModifier(mRepeat);
        setPausedModifier(mPaused);
        setVolumeModifier(mVolume);
    }

    @Override
    public void onPrepared(MediaPlayer mp) {
        WritableMap event = Arguments.createMap();
        event.putDouble("duration", (double) mp.getDuration() / (double) 1000);
        event.putDouble("currentTime", (double) mp.getCurrentPosition() / (double) 1000);
        // TODO: Add canX properties.
        mEventEmitter.receiveEvent(getId(), Events.EVENT_LOAD.toString(), event);

        applyModifiers();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        WritableMap error = Arguments.createMap();
        error.putInt("what", what);
        error.putInt("extra", extra);
        WritableMap event = Arguments.createMap();
        event.putMap("error", error);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_ERROR.toString(), event);
        return true;
    }

    @Override
    public void seekTo(int msec) {
        WritableMap event = Arguments.createMap();
        event.putDouble("currentTime", (double) getCurrentPosition() / (double) 1000);
        event.putDouble("seekTime", (double) msec / (double) 1000);
        mEventEmitter.receiveEvent(getId(), Events.EVENT_SEEK.toString(), event);

        super.seekTo(msec);
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        mEventEmitter.receiveEvent(getId(), Events.EVENT_END.toString(), null);
    }
}
