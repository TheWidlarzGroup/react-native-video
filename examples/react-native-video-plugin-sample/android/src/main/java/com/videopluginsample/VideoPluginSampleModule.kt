package com.videopluginsample

import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.util.EventLogger
import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.react.RNVPlugin
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VideoPluginSampleModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), RNVPlugin, Player.Listener {

  private val debugEventLogger = EventLogger("RNVPluginSample")

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun setMetadata(promise: Promise) {
    promise.resolve(true)
  }

  companion object {
    const val NAME = "VideoPluginSample"
    const val TAG = "VideoPluginSampleModule"
  }

  override fun onPlayerError(error: PlaybackException) {
    DebugLog.e(TAG, "onPlayerError: " + error.errorCodeName)
  }


  override fun onInstanceCreated(id: String, player: Any) {
    if (player is ExoPlayer) {
      player.addAnalyticsListener(debugEventLogger)
      player.addListener(this)
    }
  }

  override fun onInstanceRemoved(id: String, player: Any) {
    if (player is ExoPlayer) {
      player.removeAnalyticsListener(debugEventLogger)
    }
  }
}
