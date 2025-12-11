package com.margelo.nitro.video

import android.util.Log
import com.margelo.nitro.core.NullType
import java.util.UUID

data class ListenerPair(val id: UUID, val eventName: String, val callback: Any)

class HybridVideoPlayerEventEmitter : HybridVideoPlayerEventEmitterSpec() {
  var listeners: MutableList<ListenerPair> = mutableListOf()

  // MARK: - Private helpers
  private fun <T : Any> addListener(eventName: String, listener: T): ListenerSubscription {
    val id = UUID.randomUUID()
    listeners.add(ListenerPair(id, eventName, listener))
    return ListenerSubscription { listeners.removeAll { it.id == id } }
  }

  private inline fun <reified T> emitEvent(eventName: String, invokeCallback: (T) -> Unit) {
    listeners.filter { it.eventName == eventName }.forEach { pair ->
      try {
        @Suppress("UNCHECKED_CAST")
        val callback = pair.callback as? T
        if (callback == null) {
          Log.d(TAG, "Invalid callback type for $eventName")
          return@forEach
        }
        invokeCallback(callback)
      } catch (error: Error) {
        Log.d(TAG, "Error calling $eventName listener $error")
      }
    }
  }

  // MARK: - Listener registration methods
  
  override fun addOnAudioBecomingNoisyListener(listener: () -> Unit) =
    addListener("onAudioBecomingNoisy", listener)

  override fun addOnAudioFocusChangeListener(listener: (Boolean) -> Unit) =
    addListener("onAudioFocusChange", listener)

  override fun addOnBandwidthUpdateListener(listener: (BandwidthData) -> Unit) =
    addListener("onBandwidthUpdate", listener)

  override fun addOnBufferListener(listener: (Boolean) -> Unit) =
    addListener("onBuffer", listener)

  override fun addOnControlsVisibleChangeListener(listener: (Boolean) -> Unit) =
    addListener("onControlsVisibleChange", listener)

  override fun addOnEndListener(listener: () -> Unit) =
    addListener("onEnd", listener)

  override fun addOnExternalPlaybackChangeListener(listener: (Boolean) -> Unit) =
    addListener("onExternalPlaybackChange", listener)

  override fun addOnLoadListener(listener: (onLoadData) -> Unit) =
    addListener("onLoad", listener)

  override fun addOnLoadStartListener(listener: (onLoadStartData) -> Unit) =
    addListener("onLoadStart", listener)

  override fun addOnPlaybackStateChangeListener(listener: (onPlaybackStateChangeData) -> Unit) =
    addListener("onPlaybackStateChange", listener)

  override fun addOnPlaybackRateChangeListener(listener: (Double) -> Unit) =
    addListener("onPlaybackRateChange", listener)

  override fun addOnProgressListener(listener: (onProgressData) -> Unit) =
    addListener("onProgress", listener)

  override fun addOnReadyToDisplayListener(listener: () -> Unit) =
    addListener("onReadyToDisplay", listener)

  override fun addOnSeekListener(listener: (Double) -> Unit) =
    addListener("onSeek", listener)

  override fun addOnStatusChangeListener(listener: (VideoPlayerStatus) -> Unit) =
    addListener("onStatusChange", listener)

  override fun addOnTimedMetadataListener(listener: (TimedMetadata) -> Unit) =
    addListener("onTimedMetadata", listener)

  override fun addOnTextTrackDataChangedListener(listener: (Array<String>) -> Unit) =
    addListener("onTextTrackDataChanged", listener)

  override fun addOnTrackChangeListener(listener: (Variant_NullType_TextTrack?) -> Unit) =
    addListener("onTrackChange", listener)

  override fun addOnVolumeChangeListener(listener: (onVolumeChangeData) -> Unit) =
    addListener("onVolumeChange", listener)

  override fun clearAllListeners() {
    listeners.clear()
  }

  // MARK: - Event emission methods

  fun onAudioBecomingNoisy() =
    emitEvent<() -> Unit>("onAudioBecomingNoisy") { it() }

  fun onAudioFocusChange(hasFocus: Boolean) =
    emitEvent<(Boolean) -> Unit>("onAudioFocusChange") { it(hasFocus) }

  fun onBandwidthUpdate(data: BandwidthData) =
    emitEvent<(BandwidthData) -> Unit>("onBandwidthUpdate") { it(data) }

  fun onBuffer(isBuffering: Boolean) =
    emitEvent<(Boolean) -> Unit>("onBuffer") { it(isBuffering) }

  fun onControlsVisibleChange(isVisible: Boolean) =
    emitEvent<(Boolean) -> Unit>("onControlsVisibleChange") { it(isVisible) }

  fun onEnd() =
    emitEvent<() -> Unit>("onEnd") { it() }

  fun onExternalPlaybackChange(isExternalPlayback: Boolean) =
    emitEvent<(Boolean) -> Unit>("onExternalPlaybackChange") { it(isExternalPlayback) }

  fun onLoad(data: onLoadData) =
    emitEvent<(onLoadData) -> Unit>("onLoad") { it(data) }

  fun onLoadStart(data: onLoadStartData) =
    emitEvent<(onLoadStartData) -> Unit>("onLoadStart") { it(data) }

  fun onPlaybackStateChange(data: onPlaybackStateChangeData) =
    emitEvent<(onPlaybackStateChangeData) -> Unit>("onPlaybackStateChange") { it(data) }

  fun onPlaybackRateChange(rate: Double) =
    emitEvent<(Double) -> Unit>("onPlaybackRateChange") { it(rate) }

  fun onProgress(data: onProgressData) =
    emitEvent<(onProgressData) -> Unit>("onProgress") { it(data) }

  fun onReadyToDisplay() =
    emitEvent<() -> Unit>("onReadyToDisplay") { it() }

  fun onSeek(position: Double) =
    emitEvent<(Double) -> Unit>("onSeek") { it(position) }

  fun onTimedMetadata(metadata: TimedMetadata) =
    emitEvent<(TimedMetadata) -> Unit>("onTimedMetadata") { it(metadata) }

  fun onTextTrackDataChanged(tracks: Array<String>) =
    emitEvent<(Array<String>) -> Unit>("onTextTrackDataChanged") { it(tracks) }

  fun onTrackChange(track: TextTrack?) {
    val param = if (track == null) {
      Variant_NullType_TextTrack.create(NullType.NULL)
    } else {
      Variant_NullType_TextTrack.create(track)
    }
    emitEvent<(Variant_NullType_TextTrack?) -> Unit>("onTrackChange") { it(param) }
  }

  fun onVolumeChange(data: onVolumeChangeData) =
    emitEvent<(onVolumeChangeData) -> Unit>("onVolumeChange") { it(data) }

  fun onStatusChange(status: VideoPlayerStatus) =
    emitEvent<(VideoPlayerStatus) -> Unit>("onStatusChange") { it(status) }

  companion object {
    const val TAG = "HybridVideoPlayerEventEmitter"
  }
}
