package com.twg.video.core.utils

import android.view.View
import android.view.WindowInsets
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import com.margelo.nitro.video.NativeControlsStyles

@OptIn(UnstableApi::class)
object ControlsStylesUtils {
  val DEFAULT = NativeControlsStyles(
    hideSeekBar = false,
    hideDuration = false,
    hidePosition = false,
    hidePlayPause = false,
    hideForward = false,
    hideRewind = false,
    hideNext = false,
    hidePrevious = false,
    hideFullscreen = false,
    hideSettingButton = false,
    hideNavigationBarOnFullScreenMode = true,
    hideNotificationBarOnFullScreenMode = true,
  )

  /**
   * Shows or hides single elements of the media3 controller.
   * The fullscreen button is handled by the view, because it depends on the click listener.
   */
  fun apply(playerView: PlayerView, styles: NativeControlsStyles) {
    // These four have a public API, and the controller keeps them in sync with the player's commands.
    playerView.setShowFastForwardButton(!styles.hideForward)
    playerView.setShowRewindButton(!styles.hideRewind)
    playerView.setShowNextButton(!styles.hideNext)
    playerView.setShowPreviousButton(!styles.hidePrevious)

    // The rest has no API in PlayerView, so the views are toggled by id.
    setHidden(playerView, androidx.media3.ui.R.id.exo_progress, styles.hideSeekBar)
    setHidden(playerView, androidx.media3.ui.R.id.exo_position, styles.hidePosition)
    setHidden(playerView, androidx.media3.ui.R.id.exo_duration, styles.hideDuration)
    // Position and duration share a container with the separator between them.
    setHidden(playerView, androidx.media3.ui.R.id.exo_time, styles.hidePosition && styles.hideDuration)
    setHidden(playerView, androidx.media3.ui.R.id.exo_play_pause, styles.hidePlayPause)
    setHidden(playerView, androidx.media3.ui.R.id.exo_settings, styles.hideSettingButton)
  }

  private fun setHidden(playerView: PlayerView, id: Int, hidden: Boolean) {
    playerView.findViewById<View>(id)?.visibility = if (hidden) View.GONE else View.VISIBLE
  }

  /** System bars that fullscreen hides (Android 11+). 0 means none. */
  @RequiresApi(30)
  fun fullscreenHiddenBars(styles: NativeControlsStyles): Int {
    var types = 0
    if (styles.hideNotificationBarOnFullScreenMode) types = types or WindowInsets.Type.statusBars()
    if (styles.hideNavigationBarOnFullScreenMode) types = types or WindowInsets.Type.navigationBars()
    return types
  }

  /** Legacy system UI flags that fullscreen sets (before Android 11). */
  @Suppress("DEPRECATION")
  fun fullscreenLegacyFlags(styles: NativeControlsStyles): Int {
    var flags = 0
    if (styles.hideNotificationBarOnFullScreenMode) {
      flags = flags or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_FULLSCREEN
    }
    if (styles.hideNavigationBarOnFullScreenMode) {
      flags = flags or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
    }
    if (flags != 0) {
      flags = flags or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }
    return flags
  }
}
