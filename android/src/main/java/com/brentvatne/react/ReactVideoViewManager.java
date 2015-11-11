package com.brentvatne.react;

import android.content.Context;
import com.brentvatne.react.ReactVideoView.Events;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;

import javax.annotation.Nullable;
import java.util.Map;

public class ReactVideoViewManager extends SimpleViewManager<ReactVideoView> {

    public static final String REACT_CLASS = "RCTVideo";

    public static final String PROP_SRC = "src";
    public static final String PROP_SRC_URI = "uri";
    public static final String PROP_SRC_TYPE = "type";
    public static final String PROP_SRC_IS_NETWORK = "isNetwork";
    public static final String PROP_RESIZE_MODE = "resizeMode";
    public static final String PROP_REPEAT = "repeat";
    public static final String PROP_PAUSED = "paused";
    public static final String PROP_MUTED = "muted";
    public static final String PROP_VOLUME = "volume";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactVideoView createViewInstance(ThemedReactContext themedReactContext) {
        return new ReactVideoView(themedReactContext);
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        MapBuilder.Builder builder = MapBuilder.builder();
        for (Events event : Events.values()) {
            builder.put(event.toString(), MapBuilder.of("registrationName", event.toString()));
        }
        return builder.build();
    }

    @Override
    @Nullable
    public Map getExportedViewConstants() {
        return MapBuilder.of(
                "ScaleNone", Integer.toString(ScalableType.LEFT_TOP.ordinal()),
                "ScaleToFill", Integer.toString(ScalableType.FIT_XY.ordinal()),
                "ScaleAspectFit", Integer.toString(ScalableType.FIT_CENTER.ordinal()),
                "ScaleAspectFill", Integer.toString(ScalableType.CENTER_CROP.ordinal())
        );
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(final ReactVideoView videoView, @Nullable ReadableMap src) {
        final ThemedReactContext themedReactContext = (ThemedReactContext) videoView.getContext();
        final RCTEventEmitter eventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

        try {
            final String uriString = src.getString(PROP_SRC_URI);
            final String type = src.getString(PROP_SRC_TYPE);
            final boolean isNetwork = src.getBoolean(PROP_SRC_IS_NETWORK);

            videoView.reset();

            if (isNetwork) {
                videoView.setDataSource(uriString);
            } else {
                Context context = videoView.getContext();
                videoView.setRawData(context.getResources().getIdentifier(uriString, "raw", context.getPackageName()));
            }

            WritableMap writableSrc = Arguments.createMap();
            writableSrc.putString(PROP_SRC_URI, uriString);
            writableSrc.putString(PROP_SRC_TYPE, type);
            writableSrc.putBoolean(PROP_SRC_IS_NETWORK, isNetwork);
            WritableMap event = Arguments.createMap();
            event.putMap(PROP_SRC, writableSrc);
            eventEmitter.receiveEvent(videoView.getId(), Events.EVENT_LOAD_START.toString(), event);

            videoView.prepare();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final ReactVideoView videoView, final String resizeModeOrdinalString) {
        videoView.setResizeModeModifier(ScalableType.values()[Integer.parseInt(resizeModeOrdinalString)]);
    }

    @ReactProp(name = PROP_REPEAT)
    public void setRepeat(final ReactVideoView videoView, final boolean repeat) {
        videoView.setRepeatModifier(repeat);
    }

    @ReactProp(name = PROP_PAUSED)
    public void setPaused(final ReactVideoView videoView, final boolean paused) {
        videoView.setPausedModifier(paused);
    }

    @ReactProp(name = PROP_MUTED)
    public void setMuted(final ReactVideoView videoView, final boolean muted) {
        videoView.setMutedModifier(muted);
    }

    @ReactProp(name = PROP_VOLUME)
    public void setVolume(final ReactVideoView videoView, final float volume) {
        videoView.setVolumeModifier(volume);
    }
}
