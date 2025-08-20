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
import com.diceplatform.doris.entity.TracksPolicy;

public final class ReactTVExoDorisFactory {

    public ExoDoris createPlayer(
            @NonNull Context context,
            AdType adType,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable AdViewProvider adViewProvider,
            @Nullable AdChoicesClickViewRenderer adChoicesClickViewRenderer,
            TracksPolicy tracksPolicy) {
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
                tracksPolicy);
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
            @Nullable TracksPolicy tracksPolicy) {

        return new ExoDorisBuilder(context)
                .setEnableManifestScte35(adType == AdType.IMA_CSAI_LIVE)
                .setPlayWhenReady(playWhenReady)
                .setUserAgent(userAgent)
                .setLoadBufferMs(loadBufferMs)
                .setForwardIncrementMs(forwardIncrementMs)
                .setRewindIncrementMs(rewindIncrementMs)
                .setParamsBuilder(parametersBuilder)
                .setTracksPolicy(tracksPolicy)
                .setPlayerExtensionProvider(new ReactTVExoDorisExtensionFactory(adViewProvider, adChoicesClickViewRenderer))
                .build();
    }
}
