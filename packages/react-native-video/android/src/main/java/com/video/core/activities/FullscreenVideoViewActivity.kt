package com.video.core.activities

import android.annotation.SuppressLint
import android.app.Activity
import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.Rational
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.ImageButton
import androidx.annotation.RequiresApi
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import com.margelo.nitro.video.HybridVideoPlayer
import com.video.R
import com.video.core.VideoManager
import com.video.core.utils.PictureInPictureUtils.calculateAspectRatio
import com.video.core.utils.PictureInPictureUtils.calculateSourceRectHint
import com.video.view.VideoView
import java.lang.ref.WeakReference

@UnstableApi
class FullscreenVideoViewActivity : Activity() {
  private lateinit var container: View
  lateinit var playerView: PlayerView

  var videoViewNitroId: Int = -1
  private var videoView: WeakReference<VideoView>? = null

  private lateinit var player: HybridVideoPlayer

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.fullscreen_video_view_activity)
    container = findViewById(R.id.fullscreen_container)
    playerView = findViewById(R.id.player_view)

    try {
      videoViewNitroId = intent.getIntExtra("nitroId", -1)

      if (videoViewNitroId == -1) throw Exception("nitroId not found")

      videoView = VideoManager.getVideoViewWeakReferenceByNitroId(videoViewNitroId)

      player = VideoManager.getPlayerByNitroId(videoViewNitroId)
        ?: throw Exception("Player not found")

      player.moveToFullscreenActivity(this)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val params = PictureInPictureParams.Builder()
          .setAutoEnterEnabled(videoView?.get()?.autoEnterPictureInPicture == true)
          .setSourceRectHint(calculateSourceRectHint(playerView))
          .setAspectRatio(calculateAspectRatio(playerView))
          .build()

        setPictureInPictureParams(params)
      }
    } catch (error: Error) {
      Log.e("ReactNativeVideo - FullscreenVideoViewActivity", error.message, error)
      finish()
      return
    }
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

    if (isInPictureInPictureMode) {
      playerView.useController = false
    } else {
      playerView.useController = videoView?.get()?.useController == true
    }
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    setupFullScreenButton()
    hideSystemUI()
  }

  override fun onDestroy() {
    super.onDestroy()
    finish()
  }

  override fun finish() {
    super.finish()
    VideoManager.unregisterFullscreenActivity(hashCode(), player)
    videoView?.get()?.exitFullscreen()
  }

  @SuppressLint("PrivateResource")
  private fun setupFullScreenButton() {
    playerView.setFullscreenButtonClickListener { _ ->
      finish()
    }

    // We need to manually change icon, as we are using separate PlayerView in fullscreen activity
    val button = playerView.findViewById<ImageButton>(androidx.media3.ui.R.id.exo_fullscreen)
    button.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit)
  }

  @Suppress("DEPRECATION")
  private fun hideSystemUI() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      container.fitsSystemWindows = false
      container.windowInsetsController?.let { controller ->
        controller.hide(WindowInsets.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        or View.SYSTEM_UI_FLAG_FULLSCREEN)
    }
  }
}
