package com.brentvatne.common.toolbox

import android.content.ContentValues
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import androidx.media3.common.util.Util
import com.facebook.react.bridge.ReactApplicationContext
import java.io.IOException
import java.io.OutputStream

object CaptureUtil {
    @JvmStatic
    fun capture(reactContext: ReactApplicationContext, view: View) {
        val bitmap: Bitmap?
        if (view is TextureView) {
            bitmap = view.bitmap
            try {
                saveImageToStream(bitmap, reactContext)
            } catch (e: IOException) {
                throw e
            }
        } else if (Util.SDK_INT >= 24 && view is SurfaceView) {
            bitmap = Bitmap.createBitmap(view.getWidth(), view.getHeight(), Bitmap.Config.ARGB_8888)
            PixelCopy.request(view, bitmap, { copyResult: Int ->
                if (copyResult == PixelCopy.SUCCESS) {
                    try {
                        saveImageToStream(bitmap, reactContext)
                    } catch (e: IOException) {
                        e.printStackTrace()
                    }
                }
            }, Handler(Looper.getMainLooper()))
        } else {
            // https://stackoverflow.com/questions/27817577/android-take-screenshot-of-surface-view-shows-black-screen/27824250#27824250
            throw RuntimeException("SurfaceView couldn't support capture under SDK 24")
        }
    }

    private fun saveImageToStream(bitmap: Bitmap?, reactContext: ReactApplicationContext) {
        val isUnderQ = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
        val values = contentValues()
        val resolver = reactContext.contentResolver
        var stream: OutputStream? = null
        var uri: Uri? = null
        try {
            if (!isUnderQ) {
                values.put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val imageCollection = MediaStore.Images.Media.getContentUri(if (isUnderQ) MediaStore.VOLUME_EXTERNAL else MediaStore.VOLUME_EXTERNAL_PRIMARY)
            uri = resolver.insert(imageCollection, values)
            if (uri == null) {
                throw IOException("Failed to create new MediaStore record.")
            }
            stream = resolver.openOutputStream(uri)
            if (stream == null) {
                throw IOException("Failed to get output stream.")
            }
            if (!bitmap!!.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
                throw IOException("Failed to save bitmap.")
            }
            if (!isUnderQ) {
                values.clear()
                values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }
        } catch (e: IOException) {
            if (uri != null) {
                // Don't leave an orphan entry in the MediaStore
                resolver.delete(uri, null, null)
            }
            throw e
        } finally {
            stream?.close()
        }
    }

    private fun contentValues(): ContentValues {
        val values = ContentValues()
        values.put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
        values.put(MediaStore.MediaColumns.DATE_ADDED, System.currentTimeMillis() / 1000)
        values.put(MediaStore.MediaColumns.DATE_TAKEN, System.currentTimeMillis())
        return values
    }
}
