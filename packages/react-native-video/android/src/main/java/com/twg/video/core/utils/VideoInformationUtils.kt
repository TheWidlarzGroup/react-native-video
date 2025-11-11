package com.twg.video.core.utils

import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.webkit.URLUtil
import com.margelo.nitro.video.VideoInformation
import androidx.core.net.toUri

object VideoInformationUtils {
  fun fromUri(uri: String, headers: Map<String, String> = emptyMap()): VideoInformation {
    val retriever = MediaMetadataRetriever()

    when {
      URLUtil.isFileUrl(uri) -> {
        retriever.setDataSource(uri.toUri().path)
      }
      else -> {
        retriever.setDataSource(uri, headers)
      }
    }

    // Get dimensions
    val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toDoubleOrNull() ?: Double.NaN
    val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toDoubleOrNull() ?: Double.NaN

    // Get duration in milliseconds, convert to long
    val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: -1L

    // If we have some valid info, but there is no duration it might be live
    val isLive = !width.isNaN() && !height.isNaN() && duration <= 0

    // Get bitrate
    val bitrate = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)?.toDoubleOrNull() ?: Double.NaN

    // Get rotation
    val rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0

    // Check for HDR by looking at color transfer (API 30+)
    val isHDR = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val colorTransfer = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_COLOR_TRANSFER)?.toIntOrNull()
      colorTransfer == MediaFormat.COLOR_TRANSFER_ST2084 || colorTransfer == MediaFormat.COLOR_TRANSFER_HLG
    } else {
      false
    }

    // Clean up
    retriever.release()

    // Get file size
    val fileSize = VideoFileHelper.getFileSizeFromUri(uri)

    val videoInfo = VideoInformation(
      bitrate = bitrate,
      width = width,
      height = height,
      duration = duration,
      fileSize = fileSize,
      isHDR = isHDR,
      isLive = isLive,
      orientation = VideoOrientationUtils.fromWHR(width.toInt(), height.toInt(), rotation)
    )

    return videoInfo
  }
}
