// BLOOMBERG: IMA server-side ad insertion media source wrapper

package androidx.media3.exoplayer.ima;

import android.content.Context;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy;

public class ImaServerSideAdInsertionMediaSource {
    
    public static class AdsLoader {
        public void setPlayer(@Nullable Player player) {
        }

        public void release() {
        }

        public static class Builder {
            public Builder(Context context, View playerView) {
            }

            public Builder setAdEventListener(Object listener) {
                return this;
            }

            public Builder setAdErrorListener(Object listener) {
                return this;
            }

            public AdsLoader build() {
                return new AdsLoader();
            }
        }
    }

    public static class Factory implements MediaSource.Factory {
        public Factory(AdsLoader adsLoader, MediaSource.Factory mediaSourceFactory) {
        }

        @Override
        public MediaSource.Factory setDrmSessionManagerProvider(DrmSessionManagerProvider drmSessionManagerProvider) {
            return this;
        }

        @Override
        public MediaSource.Factory setLoadErrorHandlingPolicy(LoadErrorHandlingPolicy loadErrorHandlingPolicy) {
            return this;
        }

        @Override
        public int[] getSupportedTypes() {
            return new int[0];
        }

        @Override
        public MediaSource createMediaSource(MediaItem mediaItem) {
            return null;
        }
    }
}

