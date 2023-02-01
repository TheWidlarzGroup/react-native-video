package com.brentvatne.exoplayer;

import static com.google.android.exoplayer2.util.Assertions.checkNotNull;

import android.content.Context;
import android.view.SurfaceView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.ExoDorisBuilder;
import com.diceplatform.doris.entity.DorisAdEvent.AdType;
import com.diceplatform.doris.ext.imacsai.ExoDorisImaCsaiBuilder;
import com.diceplatform.doris.ext.imadai.ExoDorisImaDaiBuilder;
import com.diceplatform.doris.plugin.Plugin;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector.Parameters;
import com.google.android.exoplayer2.ui.AdViewProvider;

import java.util.List;

public final class ReactTVExoDorisFactory {

    public ExoDoris createPlayer(
            @NonNull Context context,
            AdType adType,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable Parameters.Builder parametersBuilder,
            @Nullable AdViewProvider adViewProvider) {
        return createPlayer(
                context,
                adType,
                true,
                null,
                loadBufferMs,
                forwardIncrementMs,
                rewindIncrementMs,
                null,
                null,
                parametersBuilder,
                adViewProvider);
    }

    public ExoDoris createPlayer(
            @NonNull Context context,
            AdType adType,
            boolean playWhenReady,
            @Nullable String userAgent,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable List<Plugin> plugins,
            @Nullable SurfaceView surfaceView,
            @Nullable Parameters.Builder parametersBuilder,
            @Nullable AdViewProvider adViewProvider) {
        final ExoDorisBuilder builder;
        if (adType == AdType.IMA_DAI) {
            builder = new ExoDorisImaDaiBuilder(context).setAdViewProvider(checkNotNull(adViewProvider));
        } else if (adType == AdType.IMA_CSAI) {
            builder = new ExoDorisImaCsaiBuilder(context).setAdViewProvider(checkNotNull(adViewProvider));
        } else {
            builder = new ExoDorisBuilder(context);
        }

        return builder
                .setPlayWhenReady(playWhenReady)
                .setUserAgent(userAgent)
                .setLoadBufferMs(loadBufferMs)
                .setForwardIncrementMs(forwardIncrementMs)
                .setRewindIncrementMs(rewindIncrementMs)
                .setPlugins(plugins)
                .setSurfaceView(surfaceView)
                .setParamsBuilder(parametersBuilder)
                .build();
    }
}
