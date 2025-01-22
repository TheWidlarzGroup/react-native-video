package com.video.utils

import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.webkit.URLUtil
import com.margelo.nitro.video.VideoInformation
import com.margelo.nitro.video.VideoOrientation
import java.io.File
import java.net.URL
import java.net.URLConnection

class AssetUtils {
  companion object {
    fun getAssetInformation(uri: String): VideoInformation {
      val retriever = MediaMetadataRetriever()

      when {
        URLUtil.isFileUrl(uri) -> {
          retriever.setDataSource(Uri.parse(uri).path)
        }
        else -> {
          //TODO: pass headers here
          retriever.setDataSource(uri, HashMap<String, String>())
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
      val fileSize = getFileSizeFromUri(uri)

      val videoInfo = VideoInformation(
        bitrate = bitrate,
        width = width,
        height = height,
        duration = duration,
        fileSize = fileSize,
        isHDR = isHDR,
        isLive = isLive,
        orientation = getVideoOrientation(width.toInt(), height.toInt(), rotation)
      )

      return videoInfo
    }

    fun getFileSizeFromUri(uri: String): Long {
      return try {
        when {
          URLUtil.isFileUrl(uri) -> {
            val file = File(Uri.parse(uri).path ?: return -1)
            if (file.exists()) file.length() else -1
          }
          URLUtil.isNetworkUrl(uri) -> {
            val connection: URLConnection = URL(uri).openConnection()
            connection.connect()
            connection.contentLength.toLong()
          }
          else -> -1
        }
      } catch (e: Exception) {
        -1
      }
    }

    fun getVideoOrientation(width: Int?, height: Int?, rotation: Int?): VideoOrientation {
      if (width == 0 || height == 0 || height == null || width == null) return VideoOrientation.UNKNOWN

      // Check if video is portrait or landscape using natural size
      val isNaturalSizePortrait = height > width

      // If rotation is not available, use natural size to determine orientation
      if (rotation == null) {
        return if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
      }

      // Normalize rotation to 0-360 range
      val normalizedRotation = ((rotation % 360) + 360) % 360

      return when (normalizedRotation) {
        0 -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
        90 -> VideoOrientation.PORTRAIT
        180 -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT_UPSIDE_DOWN else VideoOrientation.LANDSCAPE_LEFT
        270 -> VideoOrientation.PORTRAIT_UPSIDE_DOWN
        else -> if (isNaturalSizePortrait) VideoOrientation.PORTRAIT else VideoOrientation.LANDSCAPE_RIGHT
      }
    }
  }
}
