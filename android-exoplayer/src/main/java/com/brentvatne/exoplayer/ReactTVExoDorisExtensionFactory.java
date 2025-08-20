package com.brentvatne.exoplayer;

import static androidx.media3.common.util.Assertions.checkNotNull;

import androidx.annotation.NonNull;
import androidx.media3.common.AdViewProvider;

import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.common.ad.ui.AdChoicesClickViewRenderer;
import com.diceplatform.doris.entity.AdType;
import com.diceplatform.doris.entity.Source;
import com.diceplatform.doris.ext.imacsai.ExoDorisImaCsaiExtension;
import com.diceplatform.doris.ext.imacsailive.ExoDorisImaCsaiLiveExtension;
import com.diceplatform.doris.ext.imadai.ExoDorisImaDaiExtension;
import com.diceplatform.doris.ext.mediatailor.ssai.ExoDorisAmtSsaiExtension;
import com.diceplatform.doris.ext.yossai.ExoDorisYoSsaiExtension;
import com.diceplatform.doris.extension.ExoDorisExtension;
import com.diceplatform.doris.service.ServiceContainer;

/**
 * A factory class that produces a test playlist data set.
 */
public final class ReactTVExoDorisExtensionFactory implements ExoDorisExtension.Provider {

    private final AdViewProvider adViewProvider;
    private final AdChoicesClickViewRenderer adChoicesClickViewRenderer;

    public ReactTVExoDorisExtensionFactory(AdViewProvider adViewProvider, AdChoicesClickViewRenderer adChoicesClickViewRenderer) {
        this.adViewProvider = adViewProvider;
        this.adChoicesClickViewRenderer = adChoicesClickViewRenderer;
    }

    @NonNull
    @Override
    public ExoDorisExtension createExtension(
            @NonNull ExoDoris player,
            @NonNull ServiceContainer serviceContainer,
            @NonNull Source source) {
        AdType adType = Source.getAdType(source);
        ExoDorisExtension extension = ExoDoris.DUMMY_PLAYER_EXTENSION;
        if (adType == null) {
            return extension;
        }
        switch (adType) {
            case YO_SSAI:
                extension = new ExoDorisYoSsaiExtension(player, serviceContainer, checkNotNull(adViewProvider), adChoicesClickViewRenderer);
                break;
            case AMT_SSAI:
                extension = new ExoDorisAmtSsaiExtension(player, serviceContainer, checkNotNull(adViewProvider), adChoicesClickViewRenderer);
                break;
            case IMA_DAI:
                extension = new ExoDorisImaDaiExtension(player, serviceContainer, checkNotNull(adViewProvider));
                break;
            case IMA_CSAI_LIVE:
                extension = new ExoDorisImaCsaiLiveExtension(player, serviceContainer, checkNotNull(adViewProvider), null);
                break;
            case IMA_CSAI:
                extension = new ExoDorisImaCsaiExtension(player, serviceContainer, checkNotNull(adViewProvider));
                break;
        }
        return extension;
    }
}
