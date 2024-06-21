package com.videopluginsample

import androidx.media3.common.C
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.dash.manifest.AdaptationSet
import androidx.media3.exoplayer.dash.manifest.DashManifest
import androidx.media3.exoplayer.dash.manifest.Period
import androidx.media3.exoplayer.dash.manifest.Representation
import androidx.media3.exoplayer.util.EventLogger
import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.common.toolbox.DebugLog.d
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

  @androidx.media3.common.util.UnstableApi
  override fun onEvents(player: Player, events: Player.Events) {
    if (events.contains(Player.EVENT_PLAYBACK_STATE_CHANGED) || events.contains(Player.EVENT_PLAY_WHEN_READY_CHANGED)) {
      val playbackState = player.playbackState
      if (playbackState == Player.STATE_READY) {
          val manifest = player.currentManifest
          if (manifest != null && manifest is DashManifest) {
            val dashManifest: DashManifest = manifest
            val period: Period = dashManifest.getPeriod(0)
            for (adaptationSet in period.adaptationSets) {
//            if (period.adaptationSets.size > 2) {
              //val adaptationSet: AdaptationSet = period.adaptationSets.get(i)
              if (!adaptationSet.representations.isEmpty()) {
                if (adaptationSet.type != C.TRACK_TYPE_IMAGE)
                  continue;
                val representation: Representation = adaptationSet.representations.get(0)
                val format = representation.format
                //d(TAG, "ici mime " + representation.format.containerMimeType)

                if (format.containerMimeType == "image/jpeg") {
                  // FIXME should use following function to build image url:
                  // representation.getSegmentUrl(representation, 1);
                  // FIXME tile_1.jpg should be generate
                  var newUrl = representation.baseUrls.get(0).url + format.id + "/" + "tile_1.jpg"
                  d(TAG, "ici url:" + newUrl)
                  // FIXME send it to app


                  // https://dash.akamaized.net/akamai/bbb_30fps/thumbnails_102x58/tile_1.jpg
                  // 10x20 => 200
                  // 10 min 34 sec -> 634

                }
              }
            }
          }
        }
      }
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
