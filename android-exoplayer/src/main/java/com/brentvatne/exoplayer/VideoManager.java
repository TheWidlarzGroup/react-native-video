package com.brentvatne.exoplayer;

import android.os.Environment;
import android.util.Log;
import android.widget.Toast;

import com.daasuu.mp4compose.FillMode;
import com.daasuu.mp4compose.composer.Mp4Composer;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;

import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;

public class VideoManager extends ReactContextBaseJavaModule {
    private Mp4Composer mp4Composer;


    public VideoManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VideoManager";
    }


    @ReactMethod
    public void save(String filterText, String inputUrl, String outputUrl,  Promise promise) {
        FilterTypeMP4 filterType = FilterTypeMP4.valueOf(filterText);
        WritableMap map = Arguments.createMap();

        mp4Composer = new Mp4Composer(inputUrl, outputUrl)
                .fillMode(FillMode.PRESERVE_ASPECT_FIT)
                .filter(FilterTypeMP4.createGlFilter(filterType))
                .listener(new Mp4Composer.Listener() {
                    @Override
                    public void onProgress(double progress) {

                    }

                    @Override
                    public void onCompleted() {
                        Log.d("completed", "completed");
                        map.putString("uri", outputUrl);
                        promise.resolve(map);
                    }

                    @Override
                    public void onCanceled() {

                    }

                    @Override
                    public void onFailed(Exception exception) {
                        promise.resolve(exception.getMessage());
                        Log.d("failed", "onFailed()");
                    }
                })
                .start();

    }
}
