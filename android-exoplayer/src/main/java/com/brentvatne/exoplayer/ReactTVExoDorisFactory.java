package com.brentvatne.exoplayer;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.AdViewProvider;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector.Parameters;

import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.ExoDorisBuilder;
import com.diceplatform.doris.common.ad.ui.AdChoicesClickViewRenderer;
import com.diceplatform.doris.entity.AdType;
import com.diceplatform.doris.entity.SubtitlesPolicy;

public final class ReactTVExoDorisFactory {

    public ExoDoris createPlayer(
            @NonNull Context context,
            AdType adType,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable AdViewProvider adViewProvider,
            @Nullable AdChoicesClickViewRenderer adChoicesClickViewRenderer,
            SubtitlesPolicy subtitlesPolicy) {
        return createPlayer(
                context,
                adType,
                true,
                null,
                loadBufferMs,
                forwardIncrementMs,
                rewindIncrementMs,
                null,
                adViewProvider,
                adChoicesClickViewRenderer,
                subtitlesPolicy);
    }

    public ExoDoris createPlayer(
            @NonNull Context context,
            AdType adType,
            boolean playWhenReady,
            @Nullable String userAgent,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable Parameters.Builder parametersBuilder,
            @Nullable AdViewProvider adViewProvider,
            @Nullable AdChoicesClickViewRenderer adChoicesClickViewRenderer,
            @Nullable SubtitlesPolicy subtitlesPolicy) {

        return new ExoDorisBuilder(context)
                .setEnableManifestScte35(adType == AdType.IMA_CSAI_LIVE)
                .setPlayWhenReady(playWhenReady)
                .setUserAgent(userAgent)
                .setLoadBufferMs(loadBufferMs)
                .setForwardIncrementMs(forwardIncrementMs)
                .setRewindIncrementMs(rewindIncrementMs)
                .setParamsBuilder(parametersBuilder)
                .setSubtitlesPolicy(subtitlesPolicy)
                .setPlayerExtensionProvider(new ReactTVExoDorisExtensionFactory(adViewProvider, adChoicesClickViewRenderer))
                .build();
    }
}
