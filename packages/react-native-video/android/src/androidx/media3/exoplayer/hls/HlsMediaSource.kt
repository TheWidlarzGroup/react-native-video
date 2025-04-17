package androidx.media3.exoplayer.hls

import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

class HlsMediaSource {
    @UnstableApi
    class Factory(private val mediaDataSourceFactory: DataSource.Factory) : MediaSource.Factory {
        override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory {
            throw UnsupportedOperationException("Not implemented")
        }

        override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory {
            throw UnsupportedOperationException("Not implemented")
        }

        override fun getSupportedTypes(): IntArray {
            return intArrayOf()
        }

        override fun createMediaSource(mediaItem: MediaItem): MediaSource {
            throw UnsupportedOperationException("Not implemented")
        }

        fun setAllowChunklessPreparation(allowChunklessPreparation: Boolean): Factory {
            return this
        }
    }
}
