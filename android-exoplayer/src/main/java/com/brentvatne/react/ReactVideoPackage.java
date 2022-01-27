package com.brentvatne.react;
// start/Dolby xCD change
import androidx.annotation.Nullable;
// end/Dolby xCD change
import com.brentvatne.exoplayer.DefaultReactExoplayerConfig;
import com.brentvatne.exoplayer.ReactExoplayerConfig;
import com.brentvatne.exoplayer.ReactExoplayerViewManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
// start/Dolby xCD change
import com.google.android.exoplayer2.SimpleExoPlayer;
// end/Dolby xCD change

import java.util.Collections;
import java.util.List;

public class ReactVideoPackage implements ReactPackage {

    // start/Dolby xCD change
    public @Nullable ReactExoplayerConfig config;
    // end/Dolby xCD change
    private @Nullable ReactExoplayerViewManager viewManager;

    public ReactVideoPackage() {
    }

    public ReactVideoPackage(ReactExoplayerConfig config) {
        this.config = config;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    // Deprecated RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    // start/Dolby xCD change
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        if (config == null) {
            config = new DefaultReactExoplayerConfig(reactContext);
        }
        ReactExoplayerViewManager viewManager = new ReactExoplayerViewManager(config);
        this.viewManager = viewManager;
        return Collections.singletonList(viewManager);
    }

    public @Nullable SimpleExoPlayer player() {
        if (viewManager != null && viewManager.view != null) {
            return viewManager.view.player;
        } else {
            return null;
        }
    }
    // end/Dolby xCD change
}
