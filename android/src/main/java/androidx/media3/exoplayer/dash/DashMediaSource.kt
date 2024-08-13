package androidx.media3.exoplayer.dash

import androidx.media3.common.MediaItem
import androidx.media3.datasource.DataSource
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy

class DashMediaSource {
    class Factory(defaultDashChunkSource: DefaultDashChunkSource.Factory?, dataSource: DataSource.Factory?) : MediaSource.Factory {
        override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory = this

        override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory = this

        override fun getSupportedTypes(): IntArray = IntArray(0)

        override fun createMediaSource(mediaItem: MediaItem): MediaSource = throw UnsupportedOperationException("This MediaSource is not implemented.")
    }
}
