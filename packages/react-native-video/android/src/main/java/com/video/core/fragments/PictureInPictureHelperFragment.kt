package com.video.core.fragments

import android.content.res.Configuration
import android.os.Bundle
import androidx.annotation.OptIn
import androidx.fragment.app.Fragment
import androidx.media3.common.util.UnstableApi
import com.video.view.VideoView
import java.util.UUID

@OptIn(UnstableApi::class)
class PictureInPictureHelperFragment(private val videoView: VideoView) : Fragment() {
  val id: String = UUID.randomUUID().toString()

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)
    if (!isInPictureInPictureMode) {
        videoView.exitPictureInPicture()
    } else {
        videoView.hideRootContentViews()
        videoView.isInPictureInPicture = true
    }
  }
}
