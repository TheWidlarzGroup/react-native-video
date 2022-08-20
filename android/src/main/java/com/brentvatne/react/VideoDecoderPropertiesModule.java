package com.brentvatne.react;

import android.annotation.SuppressLint;
import android.media.MediaCodecList;
import android.media.MediaDrm;
import android.media.MediaFormat;
import android.media.UnsupportedSchemeException;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.UUID;

@RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR2)
public class VideoDecoderPropertiesModule extends ReactContextBaseJavaModule {

    ReactApplicationContext reactContext;

    @NonNull
    @Override
    public String getName() {
        return "VideoDecoderProperties";
    }

    @SuppressLint("ObsoleteSdkInt")
    @ReactMethod
    public void getWidevineLevel(Promise p) {
        int widevineLevel = 0;

        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.JELLY_BEAN_MR2) {
            p.resolve(widevineLevel);
            return;
        }
        final UUID WIDEVINE_UUID = new UUID(0xEDEF8BA979D64ACEL, 0xA3C827DCD51D21EDL);
        final String WIDEVINE_SECURITY_LEVEL_1 = "L1";
        final String WIDEVINE_SECURITY_LEVEL_2 = "L2";
        final String WIDEVINE_SECURITY_LEVEL_3 = "L3";
        final String SECURITY_LEVEL_PROPERTY = "securityLevel";

        String securityProperty = null;
        try {
            MediaDrm mediaDrm = new MediaDrm(WIDEVINE_UUID);
            securityProperty = mediaDrm.getPropertyString(SECURITY_LEVEL_PROPERTY);
        } catch (UnsupportedSchemeException e) {
            e.printStackTrace();
        }
        if (securityProperty == null) {
            p.resolve(widevineLevel);
            return;
        }

        switch (securityProperty) {
            case WIDEVINE_SECURITY_LEVEL_1: {
                widevineLevel = 1;
                break;
            }
            case WIDEVINE_SECURITY_LEVEL_2: {
                widevineLevel = 2;
                break;
            }
            case WIDEVINE_SECURITY_LEVEL_3: {
                widevineLevel = 3;
                break;
            }
            default: {
                // widevineLevel 0
                break;
            }
        }
        p.resolve(widevineLevel);
    }

    @SuppressLint("ObsoleteSdkInt")
    @ReactMethod
    public void isCodecSupported(String mimeType, int width, int height, Promise p) {
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
            p.resolve(false);
            return;
        }
        MediaCodecList mRegularCodecs = new MediaCodecList(MediaCodecList.REGULAR_CODECS);
        MediaFormat format = MediaFormat.createVideoFormat(mimeType, width, height);
        String codecName = mRegularCodecs.findDecoderForFormat(format);
        if (codecName == null) {
            p.resolve(false);
        } else {
            p.resolve(true);
        }
    }


    @ReactMethod
    public void isHEVCSupported(Promise p) {
        isCodecSupported("video/hevc", 1920, 1080, p);
    }

    public VideoDecoderPropertiesModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

}
