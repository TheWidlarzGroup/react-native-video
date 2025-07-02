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

    Log.d("ReactNativeVideo", "PiP mode change callback - fragment for nitroId: ${videoView.nitroId}, entering PiP: $isInPictureInPictureMode")

    if (isInPictureInPictureMode) {
      // Entering PiP mode. Check if we have a designated video, if not, determine which one should handle it.
      var currentPipVideo = VideoManager.getCurrentPictureInPictureVideo()
      Log.d("ReactNativeVideo", "Current PiP video nitroId: ${currentPipVideo?.nitroId}, this video nitroId: ${videoView.nitroId}")
      
      if (currentPipVideo == null) {
        // No video was designated (auto-enter PiP scenario)
        // Use synchronized block to prevent race condition between multiple fragments
        synchronized(VideoManager) {
          currentPipVideo = VideoManager.getCurrentPictureInPictureVideo()
          if (currentPipVideo == null) {
            Log.d("ReactNativeVideo", "No designated PiP video found, determining best candidate")
            
            if (videoView.hybridPlayer?.isPlaying == true) {
              val lastPlayed = VideoManager.getLastPlayedVideoView()

              val shouldDesignate =
                lastPlayed == null || lastPlayed.nitroId == videoView.nitroId

              if (shouldDesignate) {
                VideoManager.setCurrentPictureInPictureVideo(videoView)
                videoView.hybridPlayer?.movePlayerToVideoView(videoView)
                VideoManager.pauseOtherPlayers(videoView)
                currentPipVideo = videoView
              }
            } else {
              // If this video is not playing, check if no other playing view exists and use last-played fallback
              if (!VideoManager.isAnyVideoInPictureInPicture()) {
                val lastPlayed = VideoManager.getLastPlayedVideoView()
                val targetView = lastPlayed ?: videoView

                VideoManager.setCurrentPictureInPictureVideo(targetView)
                targetView.hybridPlayer?.movePlayerToVideoView(targetView)
                VideoManager.pauseOtherPlayers(targetView)
                currentPipVideo = targetView
              }
            }
          } else {
            Log.d("ReactNativeVideo", "Another fragment already designated a PiP video: ${currentPipVideo?.nitroId}")
          }
        }
      }
      
      if (currentPipVideo == videoView) {
        Log.d("ReactNativeVideo", "Entering PiP mode for correct video nitroId: ${videoView.nitroId}")
        videoView.hideRootContentViews()
        videoView.isInPictureInPicture = true
      } else {
        Log.d("ReactNativeVideo", "Ignoring PiP enter for video nitroId: ${videoView.nitroId} - not the designated PiP video")
      }
    } else {
      // Exiting PiP mode. Any view that currently thinks it is in PiP should handle the exit.
      if (videoView.isInPictureInPicture) {
        Log.d("ReactNativeVideo", "Exiting PiP mode for video nitroId: ${videoView.nitroId}")
        videoView.exitPictureInPicture()
      } else {
        Log.d("ReactNativeVideo", "Ignoring PiP exit for video nitroId: ${videoView.nitroId} - not currently in PiP")
      }
    }
  }
}
