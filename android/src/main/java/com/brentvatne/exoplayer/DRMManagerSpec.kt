package com.brentvatne.exoplayer

import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.drm.UnsupportedDrmException
import com.brentvatne.common.api.DRMProps
import java.util.UUID

interface DRMManagerSpec {
    /**
     * Build a DRM session manager for the given UUID and DRM properties
     * @param uuid The DRM system UUID
     * @param drmProps The DRM properties from the source
     * @return DrmSessionManager instance or null if not supported
     * @throws UnsupportedDrmException if the DRM scheme is not supported
     */
    @Throws(UnsupportedDrmException::class)
    fun buildDrmSessionManager(uuid: UUID, drmProps: DRMProps): DrmSessionManager?
}
