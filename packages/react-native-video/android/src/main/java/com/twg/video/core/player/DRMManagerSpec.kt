package com.twg.video.core.player

import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.drm.DrmSessionManager
import com.margelo.nitro.video.NativeDrmParams
import java.util.UUID

@OptIn(UnstableApi::class)
interface DRMManagerSpec {
  fun buildDrmSessionManager(drmParams: NativeDrmParams): DrmSessionManager {
    val drmScheme = drmParams.type ?: "widevine"
    val drmUuid = Util.getDrmUuid(drmScheme)

    return buildDrmSessionManager(drmParams, drmUuid)
  }

  fun buildDrmSessionManager(drmParams: NativeDrmParams, drmUuid: UUID?, retryCount: Int = 0): DrmSessionManager

  fun getDRMConfiguration(drmParams: NativeDrmParams): MediaItem.DrmConfiguration
}