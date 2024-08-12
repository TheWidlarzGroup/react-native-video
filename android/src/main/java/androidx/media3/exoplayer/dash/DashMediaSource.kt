package androidx.media3.exoplayer.dash

import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

class DashMediaSource {
    class Factory(private val chunkSourceFactory: DefaultDashChunkSource.Factory, private val dataSourceFactory: DataSource.Factory) : MediaSource.Factory {
        override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory {
            return this
        }
        override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory {
            return this
        }
        override fun getSupportedTypes(): IntArray = intArrayOf()
        override fun createMediaSource(mediaItem: MediaItem): MediaSource {
            throw UnsupportedOperationException("This MediaSource is not implemented")
        }
    }
}
