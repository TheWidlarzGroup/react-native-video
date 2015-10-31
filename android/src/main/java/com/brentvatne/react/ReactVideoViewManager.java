package com.brentvatne.react;

import android.app.Activity;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.widget.VideoView;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class ReactVideoViewManager extends SimpleViewManager<VideoView> {

    public static final String REACT_CLASS = "RCTVideo";
    private static final String PROP_SRC = "src";

    private Activity mActivity = null;

    public ReactVideoViewManager(Activity activity) {
        mActivity = activity;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected VideoView createViewInstance(ThemedReactContext themedReactContext) {
        return new VideoView(themedReactContext);
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(VideoView videoView, @Nullable ReadableMap src) {
        videoView.setVideoURI(Uri.parse(src.getString("uri")));
    }
}
