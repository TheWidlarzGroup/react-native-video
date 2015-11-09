package com.brentvatne.react;

import android.content.Context;
import android.media.MediaPlayer;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;
import com.yqritc.scalablevideoview.ScalableVideoView;

import javax.annotation.Nullable;
import java.util.Map;

import static junit.framework.Assert.assertTrue;

public class ReactVideoViewManager extends SimpleViewManager<ScalableVideoView> {

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
    protected ScalableVideoView createViewInstance(ThemedReactContext themedReactContext) {
        return new ScalableVideoView(themedReactContext);
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.builder()
                .put("onVideoLoadStart", MapBuilder.of("registrationName", "onVideoLoadStart"))
                .put("onVideoLoad", MapBuilder.of("registrationName", "onVideoLoad"))
                .put("onVideoEnd", MapBuilder.of("registrationName", "onVideoEnd"))
                .build();
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
    public void setSrc(final ScalableVideoView videoView, @Nullable ReadableMap src) {
        final ThemedReactContext themedReactContext = (ThemedReactContext) videoView.getContext();
        final RCTEventEmitter eventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

        try {
            final String uriString = src.getString("uri");
            final String type = src.getString("type");
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

            WritableMap writableSrc = Arguments.createMap();
            writableSrc.putString("uri", uriString);
            writableSrc.putString("type", type);
            writableSrc.putBoolean("isNetwork", isNetwork);
            WritableMap event = Arguments.createMap();
            event.putMap("src", writableSrc);
            eventEmitter.receiveEvent(videoView.getId(), "onVideoLoadStart", event);

            videoView.prepare(new MediaPlayer.OnPreparedListener() {
                @Override
                public void onPrepared(MediaPlayer mp) {
                    mPrepared = true;

                    mp.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                        @Override
                        public boolean onError(MediaPlayer mp, int what, int extra) {
                            // TODO: onVideoError
                            return false;
                        }
                    });

                    mp.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                        @Override
                        public void onCompletion(MediaPlayer mp) {
                            eventEmitter.receiveEvent(videoView.getId(), "onVideoEnd", null);
                        }
                    });

                    WritableMap event = Arguments.createMap();
                    event.putDouble("duration", (double) mp.getDuration() / (double) 1000);
                    event.putDouble("currentTime", (double) mp.getCurrentPosition() / (double) 1000);
                    // TODO: Add canX properties.
                    eventEmitter.receiveEvent(videoView.getId(), "onVideoLoad", event);

                    applyModifiers(videoView);
                }
            });
        } catch (Exception e) {
            // TODO: onVideoError
        }
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final ScalableVideoView videoView, final int resizeModeOrdinal) {
        mResizeMode = ScalableType.values()[resizeModeOrdinal];

        if (mPrepared) {
            videoView.setScalableType(mResizeMode);
            videoView.invalidate();
        }
    }

    @ReactProp(name = PROP_REPEAT)
    public void setRepeat(final ScalableVideoView videoView, final boolean repeat) {
        mRepeat = repeat;

        if (mPrepared) {
            videoView.setLooping(mRepeat);
        }
    }

    @ReactProp(name = PROP_PAUSED)
    public void setPaused(final ScalableVideoView videoView, final boolean paused) {
        mPaused = paused;

        if (mPrepared) {
            if (!mPaused) {
                videoView.start();
            } else {
                videoView.pause();
            }
        }
    }

    @ReactProp(name = PROP_MUTED)
    public void setMuted(final ScalableVideoView videoView, final boolean muted) {
        mMuted = muted;

        if (mPrepared) {
            if (mMuted) {
                videoView.setVolume(0, 0);
            } else {
                videoView.setVolume(mVolume, mVolume);
            }
        }
    }

    @ReactProp(name = PROP_VOLUME)
    public void setVolume(final ScalableVideoView videoView, final float volume) {
        mVolume = volume;

        if (mPrepared) {
            videoView.setVolume(mVolume, mVolume);
        }
    }

    private void applyModifiers(final ScalableVideoView videoView) {
        setResizeMode(videoView, mResizeMode.ordinal());
        setRepeat(videoView, mRepeat);
        setPaused(videoView, mPaused);
        setMuted(videoView, mMuted);
    }
}
