package androidx.media3.exoplayer.dash;

import androidx.media3.common.MediaItem;
import androidx.media3.datasource.DataSource;
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy;

public class DashMediaSource {
    public static class Factory implements MediaSource.Factory {

        public Factory(DefaultDashChunkSource.Factory factory, DataSource.Factory factory1) {
        }

        @Override
        public MediaSource.Factory setDrmSessionManagerProvider(DrmSessionManagerProvider drmSessionManagerProvider) {
            return null;
        }

        @Override
        public MediaSource.Factory setLoadErrorHandlingPolicy(LoadErrorHandlingPolicy loadErrorHandlingPolicy) {
            return null;
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

