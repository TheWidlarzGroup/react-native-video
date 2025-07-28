package com.video.core.fragments

import android.content.res.Configuration
import android.os.Bundle
import android.util.Log
import androidx.annotation.OptIn
import androidx.fragment.app.Fragment
import androidx.media3.common.util.UnstableApi
import com.video.core.VideoManager
import com.video.view.VideoView
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
