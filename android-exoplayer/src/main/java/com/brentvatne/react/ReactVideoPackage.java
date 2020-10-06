package com.brentvatne.react;

import com.brentvatne.exoplayer.ReactTVExoplayerViewManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class ReactVideoPackage implements ReactPackage {

    private final PlayerType type;

    public enum PlayerType {
        MOBILE,
        TV
    }

    public ReactVideoPackage() {
        this.type = PlayerType.MOBILE;
    }

    public ReactVideoPackage(PlayerType type) {
        this.type = type;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    // Deprecated RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.<ViewManager>singletonList(new ReactTVExoplayerViewManager(reactContext));
    }
}
