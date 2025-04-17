package androidx.media3.exoplayer.dash;

import androidx.media3.common.MediaItem;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DataSource;
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy;

class DashMediaSource {

  @UnstableApi
  class Factory(
    factory: DataSource.Factory,
  ) : MediaSource.Factory {
    // NOOP

    override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory {
      throw UnsupportedOperationException("STUB")
    }

    override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory {
      throw UnsupportedOperationException("STUB")
    }

    override fun getSupportedTypes(): IntArray {
      return intArrayOf()
    }

    override fun createMediaSource(mediaItem: MediaItem): MediaSource {
      throw UnsupportedOperationException("STUB")
    }
  }
}

