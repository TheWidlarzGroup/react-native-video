package com.video.core.utils

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.URLUtil
import com.margelo.nitro.NitroModules
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
    if (!hasReadPermission()) throw Error("App does not have permission to read file at path: $uri")

    val file = File(Uri.parse(uri).path ?: return)

    // Check if file exists and is readable
    if (!file.exists()) throw Error("File does not exist at path: $uri")

    // Check if file is readable
    if (!file.canRead()) throw Error("File is not readable at path: $uri")
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
