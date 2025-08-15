package com.twg.videodrm.DRMManager

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem.DrmConfiguration
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.drm.DefaultDrmSessionManager
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.drm.FrameworkMediaDrm
import androidx.media3.exoplayer.drm.HttpMediaDrmCallback
import androidx.media3.exoplayer.drm.MediaDrmCallback
import com.video.core.player.DRMManagerSpec
import com.margelo.nitro.NitroModules
import com.margelo.nitro.video.NativeDrmParams
import com.video.core.player.buildHttpDataSourceFactory
import com.video.core.plugins.NativeVideoPlayerSource
import java.util.UUID

class DRMManager(val source: NativeVideoPlayerSource) : DRMManagerSpec {
  private var hasDrmFailed = false
  private val context: Context
    get() {
      return NitroModules.applicationContext ?: throw Error("Context is not found")
    }

  private var headersHash = -1
  private var httpDataSourceFactory: OkHttpDataSource.Factory? = null

  private fun shouldRebuildHttpDataSource(): Boolean {
    val header = source.config.headers
    if (header == null) {
      return false
    }

    val hash = header.hashCode()
    if (hash == headersHash) {
      return false
    }

    headersHash = hash
    return true
  }

  private fun getHttpDataSourceFactory(): OkHttpDataSource.Factory {
    if (shouldRebuildHttpDataSource() || httpDataSourceFactory == null) {
      httpDataSourceFactory = buildHttpDataSourceFactory(context, source)
    }

    return httpDataSourceFactory ?: throw Error("Couldn't build HttpDataSourceFactory")
  }

  @OptIn(UnstableApi::class)
  override fun buildDrmSessionManager(
    drmParams: NativeDrmParams,
    drmUuid: UUID?,
    retryCount: Int
  ): DrmSessionManager {
    try {
      val uuid = drmUuid ?: throw Error("DRM UUID is not set")
      val mediaDrm = FrameworkMediaDrm.newInstance(drmUuid)
      val mediaDrmCallback = HttpMediaDrmCallback(
        drmParams.licenseUrl,
        getHttpDataSourceFactory(),
      )

      if (drmParams.licenseHeaders != null) {
        for ((key, value) in drmParams.licenseHeaders) {
          mediaDrmCallback.setKeyRequestProperty(key, value)
        }
      }

      if (hasDrmFailed) {
        mediaDrm.setPropertyString("securityLevel", "L3")
      }

      return DefaultDrmSessionManager.Builder()
        .setUuidAndExoMediaDrmProvider(uuid) { mediaDrm }
        .setKeyRequestParameters(null)
        .setMultiSession(drmParams.multiSession == true)
        .build(mediaDrmCallback)
    } catch (err: Exception) {
      if (retryCount < 3) {
        hasDrmFailed = true
        return buildDrmSessionManager(drmParams, drmUuid, retryCount + 1)
      }

      throw err
    }
  }

  @OptIn(UnstableApi::class)
  override fun getDRMConfiguration(drmParams: NativeDrmParams): DrmConfiguration {
    val uuid = Util.getDrmUuid(drmParams.type ?: "widevine") ?: throw Error("DRM UUID is not set")

    val configurationBuilder =  DrmConfiguration.Builder(uuid)
      .setMultiSession(drmParams.multiSession == true)
      .setLicenseUri(drmParams.licenseUrl)

    drmParams.licenseHeaders?.let {
      configurationBuilder.setLicenseRequestHeaders(it)
    }

    return configurationBuilder.build()
  }
}