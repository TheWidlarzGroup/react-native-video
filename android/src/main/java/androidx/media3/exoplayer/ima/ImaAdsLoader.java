package androidx.media3.exoplayer.ima;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.AdViewProvider;
import androidx.media3.common.Player;
import androidx.media3.datasource.DataSpec;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.ads.AdsLoader;
import androidx.media3.exoplayer.source.ads.AdsMediaSource;

import java.io.IOException;

public class ImaAdsLoader implements AdsLoader {
    public void setPlayer(ExoPlayer ignoredPlayer) {
    }

    @Override
    public void setPlayer(@Nullable Player player) {
    }

    public void release() {
    }

    @Override
    public void setSupportedContentTypes(@NonNull int... ints) {
    }

    @Override
    public void start(@NonNull AdsMediaSource adsMediaSource, @NonNull DataSpec dataSpec, @NonNull Object adsId, @NonNull AdViewProvider adViewProvider, @NonNull EventListener eventListener) {
    }

    @Override
    public void stop(@NonNull AdsMediaSource adsMediaSource, @NonNull EventListener eventListener) {
    }

    @Override
    public void handlePrepareComplete(@NonNull AdsMediaSource adsMediaSource, int i, int i1) {
    }

    @Override
    public void handlePrepareError(@NonNull AdsMediaSource adsMediaSource, int i, int i1, @NonNull IOException e) {
    }

    public static class Builder {
        public Builder(Context ignoredThemedReactContext) {
        }

        public Builder setAdEventListener(Object ignoredReactExoplayerView) {
            return this;
        }

        public Builder setAdErrorListener(Object ignoredReactExoplayerView) {
            return this;
        }

        public ImaAdsLoader build() {
            return null;
        }
    }
}
