package com.brentvatne.exoplayer;

import android.content.Context;
import android.os.Handler;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.exoplayer2.DefaultRenderersFactory;
import com.google.android.exoplayer2.Renderer;
import com.google.android.exoplayer2.audio.AudioProcessor;
import com.google.android.exoplayer2.audio.AudioRendererEventListener;
import com.google.android.exoplayer2.drm.DrmSessionManager;
import com.google.android.exoplayer2.drm.FrameworkMediaCrypto;
import com.google.android.exoplayer2.mediacodec.MediaCodecSelector;
import com.google.android.exoplayer2.util.Log;

import java.lang.reflect.Constructor;
import java.util.ArrayList;

public class DolbyRendersFactory extends DefaultRenderersFactory {

    private static final String TAG = "DolbyRendersFactory";

    public DolbyRendersFactory(Context context) {
        super(context);
    }

    @Override
    protected void buildAudioRenderers(
            @NonNull Context context,
            int extensionRendererMode,
            @NonNull MediaCodecSelector mediaCodecSelector,
            @Nullable DrmSessionManager<FrameworkMediaCrypto> drmSessionManager,
            boolean playClearSamplesWithoutKeys,
            boolean enableDecoderFallback,
            @NonNull AudioProcessor[] audioProcessors,
            @NonNull Handler eventHandler,
            @NonNull AudioRendererEventListener eventListener,
            @NonNull ArrayList<Renderer> out) {
        super.buildAudioRenderers(context, extensionRendererMode, mediaCodecSelector, drmSessionManager,
                playClearSamplesWithoutKeys, enableDecoderFallback, audioProcessors, eventHandler, eventListener, out);

        try {
            // Full class names used for constructor args so the LINT rule triggers if any of them move.
            // LINT.IfChange
            Class<?> clazz = Class.forName("com.dolby.daa.LibDaaAudioRenderer");
            Constructor<?> constructor =
                    clazz.getConstructor(
                            android.os.Handler.class,
                            com.google.android.exoplayer2.audio.AudioRendererEventListener.class,
                            com.google.android.exoplayer2.audio.AudioProcessor[].class);
            // LINT.ThenChange(../../../../../../../proguard-rules.txt)
            Renderer renderer =
                    (Renderer) constructor.newInstance(eventHandler, eventListener, audioProcessors);
            out.add(renderer);
            Log.i(TAG, "Loaded LibDaaAudioRenderer.");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "Unable to load LibDaaAudioRenderer.", e);
            // Expected if the app was built without the extension.
        } catch (Exception e) {
            Log.e(TAG, "Unable to load LibDaaAudioRenderer.", e);
            // The extension is present, but instantiation failed.
            throw new RuntimeException("Error instantiating DAA extension", e);
        }
    }
}
