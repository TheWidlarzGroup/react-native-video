package com.brentvatne.react;

import android.view.View;

import androidx.annotation.NonNull;

import com.brentvatne.exoplayer.ReactExoplayerView;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.UIManagerModule;

public class VideoManagerModule extends ReactContextBaseJavaModule {
    ReactApplicationContext reactContext;

    @NonNull
    @Override
    public String getName() {
        return "VideoManager";
    }

    @ReactMethod
    public void setPlayerStatus(Boolean shouldPlay, int reactTag) {
        UIManagerModule uiManager = getReactApplicationContext().getNativeModule(UIManagerModule.class);
        uiManager.prependUIBlock(manager -> {
            View view = manager.resolveView(reactTag);

            if (view instanceof ReactExoplayerView) {
                ReactExoplayerView videoView = (ReactExoplayerView) view;
                videoView.setPausedModifier(!shouldPlay);
            }
        });
    }

    public VideoManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }
}