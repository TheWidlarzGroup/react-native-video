package com.twg.video.core.fragments

import android.content.res.Configuration
import android.os.Bundle
import android.util.Log
import androidx.annotation.OptIn
import androidx.fragment.app.Fragment
import androidx.media3.common.util.UnstableApi
import com.twg.video.core.VideoManager
import com.twg.video.view.VideoView
import java.util.UUID

@OptIn(UnstableApi::class)
class PictureInPictureHelperFragment(private val videoView: VideoView) : Fragment() {
  val id: String = UUID.randomUUID().toString()

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)

    if (isInPictureInPictureMode) {
      var currentPipVideo = VideoManager.getCurrentPictureInPictureVideo()
      
      if (currentPipVideo == null) {
        synchronized(VideoManager) {
          currentPipVideo = VideoManager.getCurrentPictureInPictureVideo()
          if (currentPipVideo == null) {
            if (videoView.hybridPlayer?.isPlaying == true) {
              val lastPlayed = VideoManager.getLastPlayedVideoView()
              val shouldDesignate = lastPlayed == null || lastPlayed.nitroId == videoView.nitroId

              if (shouldDesignate) {
                VideoManager.setCurrentPictureInPictureVideo(videoView)
                videoView.hybridPlayer?.movePlayerToVideoView(videoView)
                VideoManager.pauseOtherPlayers(videoView)
                currentPipVideo = videoView
              }
            } else {
              if (!VideoManager.isAnyVideoInPictureInPicture()) {
                val lastPlayed = VideoManager.getLastPlayedVideoView()
                val targetView = lastPlayed ?: videoView

                VideoManager.setCurrentPictureInPictureVideo(targetView)
                targetView.hybridPlayer?.movePlayerToVideoView(targetView)
                VideoManager.pauseOtherPlayers(targetView)
                currentPipVideo = targetView
              }
            }
          }
        }
      }
      
      if (currentPipVideo == videoView) {
        // If we're currently in fullscreen, exit it first to prevent parent conflicts
        if (videoView.isInFullscreen) {
          try {
            videoView.exitFullscreen()
          } catch (e: Exception) {
            Log.w("ReactNativeVideo", "Failed to exit fullscreen before entering PiP for nitroId: ${videoView.nitroId}", e)
          }
        }

        // Now move the PlayerView to the root for PiP and hide content
        videoView.hideRootContentViews()
        videoView.isInPictureInPicture = true
      }
    } else {
      if (videoView.isInPictureInPicture) {
        videoView.exitPictureInPicture()
      }
    }
  }
}
