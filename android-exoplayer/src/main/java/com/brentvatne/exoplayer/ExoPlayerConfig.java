package com.brentvatne.exoplayer;

import android.content.Context;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class ExoPlayerConfig extends ReactContextBaseJavaModule {

    public ExoPlayerConfig(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ExoPlayerConfig";
    }

    @ReactMethod
    public void setMinBufferMs(final int newMinBufferMs, final Promise promise) {
        ReactExoplayerView.setMinBufferMs(newMinBufferMs);
        promise.resolve(null);
    }

    @ReactMethod
    public void setMaxBufferMs(final int newMaxBufferMs, final Promise promise) {
        ReactExoplayerView.setMaxBufferMs(newMaxBufferMs);
        promise.resolve(null);
    }

    @ReactMethod
    public void setBufferForPlaybackMs(final int newBufferForPlaybackMs, final Promise promise) {
        ReactExoplayerView.setBufferForPlaybackMs(newBufferForPlaybackMs);
        promise.resolve(null);
    }

    @ReactMethod
    public void setBufferForPlaybackAfterRebufferMs(final int newBufferForPlaybackAfterRebufferMs, final Promise promise) {
        ReactExoplayerView.setBufferForPlaybackAfterRebufferMs(newBufferForPlaybackAfterRebufferMs);
        promise.resolve(null);
    }
}
