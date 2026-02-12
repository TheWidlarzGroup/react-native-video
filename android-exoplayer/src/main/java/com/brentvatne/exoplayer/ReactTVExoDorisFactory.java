package com.brentvatne.exoplayer;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.AdViewProvider;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector.Parameters;

import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.ExoDorisBuilder;
import com.diceplatform.doris.common.ad.ui.AdChoicesClickViewRenderer;
import com.diceplatform.doris.entity.SubtitlesPolicy;
import com.diceplatform.doris.service.LocalizationService;
import com.diceplatform.doris.service.ServiceContainer;

public final class ReactTVExoDorisFactory {

    public ExoDoris createPlayer(
            @NonNull Context context,
            @Nullable String userAgent,
            int loadBufferMs,
            long forwardIncrementMs,
            long rewindIncrementMs,
            @Nullable Parameters.Builder parametersBuilder,
            @Nullable AdViewProvider adViewProvider,
            @Nullable AdChoicesClickViewRenderer adChoicesClickViewRenderer,
            @Nullable SubtitlesPolicy subtitlesPolicy,
            @NonNull LocalizationService localizationService) {

        ReactTVExoDorisExtensionFactory playerExtensionProvider =
                new ReactTVExoDorisExtensionFactory(
                        adViewProvider,
                        adChoicesClickViewRenderer
                );

        ServiceContainer serviceContainer = new ServiceContainer.Builder()
                .localizationService(localizationService)
                .build();

        return new ExoDorisBuilder(context)
                .setUserAgent(userAgent)
                .setLoadBufferMs(loadBufferMs)
                .setForwardIncrementMs(forwardIncrementMs)
                .setRewindIncrementMs(rewindIncrementMs)
                .setParamsBuilder(parametersBuilder)
                .setSubtitlesPolicy(subtitlesPolicy)
                .setPlayerExtensionProvider(playerExtensionProvider)
                .setServiceContainer(serviceContainer)
                .build();
    }
}
