package com.brentvatne.react;

import androidx.annotation.NonNull;

import com.brentvatne.exoplayer.DataSourceUtil;
import com.brentvatne.exoplayer.DefaultReactExoplayerConfig;
import com.brentvatne.exoplayer.ReactExoplayerConfig;
import com.brentvatne.exoplayer.ReactExoplayerViewManager;
import com.brentvatne.exoplayer.cache.SharedExoPlayerCache;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class ReactVideoPackage implements ReactPackage {

    private ReactExoplayerConfig config;

    public ReactVideoPackage() {
    }

    public ReactVideoPackage(ReactExoplayerConfig config) {
        this.config = config;
    }

    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        SharedExoPlayerCache.initCache(reactContext);
        DataSourceUtil.getDefaultHttpDataSourceFactory(reactContext);
        return Collections.singletonList(
                new VideoDecoderPropertiesModule(reactContext)
        );
    }

    // Deprecated RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }


    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        if (config == null) {
            config = new DefaultReactExoplayerConfig(reactContext);
        }
        return Collections.singletonList(new ReactExoplayerViewManager(config));
    }
}
