package com.twg.video.core.utils

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.URLUtil
import com.margelo.nitro.NitroModules
import com.twg.video.core.SourceError
import java.io.File
import java.net.URL
import java.net.URLConnection

object VideoFileHelper {
  private fun hasReadPermission(): Boolean {
    return NitroModules.applicationContext?.checkSelfPermission(
      Manifest.permission.READ_EXTERNAL_STORAGE
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun validateReadPermission(uri: String) {
    if (!hasReadPermission()) throw SourceError.MissingReadFilePermission(uri)

    val file = File(Uri.parse(uri).path ?: throw SourceError.InvalidUri(uri))

    // Check if file exists and is readable
    if (!file.exists()) throw SourceError.FileDoesNotExist(uri)

    // Check if file is readable
    if (!file.canRead()) throw SourceError.MissingReadFilePermission(uri)
  }

  fun getFileSizeFromUri(uri: String): Long {
    return try {
      when {
        URLUtil.isFileUrl(uri) -> {
          validateReadPermission(uri)
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
}
