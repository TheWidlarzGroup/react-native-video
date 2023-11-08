package com.google.android.exoplayer2.ext.ima;

import androidx.annotation.Nullable;
import androidx.media3.common.AdViewProvider;
import androidx.media3.common.Player;
import androidx.media3.datasource.DataSpec;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.ads.AdsLoader;
import androidx.media3.exoplayer.source.ads.AdsMediaSource;

import com.facebook.react.uimanager.ThemedReactContext;

import java.io.IOException;

public class ImaAdsLoader implements AdsLoader {
    public void setPlayer(ExoPlayer player) {
    }

    @Override
    public void setPlayer(@Nullable Player player) {

    }

    public void release() {
    }

    @Override
    public void setSupportedContentTypes(int... ints) {

    }

    @Override
    public void start(AdsMediaSource adsMediaSource, DataSpec dataSpec, Object adsId, AdViewProvider adViewProvider, EventListener eventListener) {

    }

    @Override
    public void stop(AdsMediaSource adsMediaSource, EventListener eventListener) {

    }

    @Override
    public void handlePrepareComplete(AdsMediaSource adsMediaSource, int i, int i1) {

    }

    @Override
    public void handlePrepareError(AdsMediaSource adsMediaSource, int i, int i1, IOException e) {

    }

    public static class Builder {
        public Builder(ThemedReactContext themedReactContext) {

        }

        public Builder setAdEventListener(Object reactExoplayerView) {
            return this;
        }

        public ImaAdsLoader build() {
            return null;
        }
    }
}
