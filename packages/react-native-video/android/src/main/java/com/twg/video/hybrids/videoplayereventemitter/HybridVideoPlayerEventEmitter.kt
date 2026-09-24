package com.margelo.nitro.video

import android.util.Log
import com.margelo.nitro.core.NullType
import java.util.UUID

data class ListenerPair(val id: UUID, val eventName: String, val callback: Any)

class HybridVideoPlayerEventEmitter : HybridVideoPlayerEventEmitterSpec() {
  private val lock = Any()

  var listeners: MutableList<ListenerPair> = mutableListOf()

  // MARK: - Private helpers
  private fun <T : Any> addListener(eventName: String, listener: T): ListenerSubscription {
    val id = UUID.randomUUID()
    synchronized(lock) {
      listeners.add(ListenerPair(id, eventName, listener))
    }
    return ListenerSubscription {
      synchronized(lock) {
        listeners.removeAll { it.id == id }
      }
    }
  }

  private inline fun <reified T> emitEvent(eventName: String, invokeCallback: (T) -> Unit) {
    val snapshot: List<ListenerPair> = synchronized(lock) {
      listeners.filter { it.eventName == eventName }.toList()
    }

    snapshot.forEach { pair ->
      try {
        @Suppress("UNCHECKED_CAST")
        val callback = pair.callback as? T ?: run {
          Log.d(TAG, "Invalid callback type for $eventName")
          return@forEach
        }
        invokeCallback(callback)
      } catch (t: Throwable) {
        Log.d(TAG, "Error calling $eventName listener", t)
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

  override fun addOnAdsResolvedListener(listener: (AdsResolvedEvent) -> Unit) =
    addListener("onAdsResolved", listener)

  override fun addOnAdBreakStartListener(listener: (AdBreakEvent) -> Unit) =
    addListener("onAdBreakStart", listener)

  override fun addOnAdBreakEndListener(listener: (AdBreakEvent) -> Unit) =
    addListener("onAdBreakEnd", listener)

  override fun addOnAdProgressListener(listener: (AdProgressInfo) -> Unit) =
    addListener("onAdProgress", listener)

  override fun addOnAdStartListener(listener: (AdInfo) -> Unit) =
    addListener("onAdStart", listener)

  override fun addOnAdCompleteListener(listener: (AdInfo) -> Unit) =
    addListener("onAdComplete", listener)

  override fun addOnAdSkippedListener(listener: (AdInfo) -> Unit) =
    addListener("onAdSkipped", listener)

  override fun addOnAdClickedListener(listener: () -> Unit) =
    addListener("onAdClicked", listener)

  override fun addOnAdErrorListener(listener: (AdErrorEvent) -> Unit) =
    addListener("onAdError", listener)

  override fun addOnAllAdsCompletedListener(listener: () -> Unit) =
    addListener("onAllAdsCompleted", listener)

  override fun addOnAdStateChangeListener(listener: (VideoAdState) -> Unit) =
    addListener("onAdStateChange", listener)

  override fun clearAllListeners() {
    synchronized(lock) {
      listeners.clear()
    }
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

  fun onAdsResolved(data: AdsResolvedEvent) =
    emitEvent<(AdsResolvedEvent) -> Unit>("onAdsResolved") { it(data) }

  fun onAdBreakStart(data: AdBreakEvent) =
    emitEvent<(AdBreakEvent) -> Unit>("onAdBreakStart") { it(data) }

  fun onAdBreakEnd(data: AdBreakEvent) =
    emitEvent<(AdBreakEvent) -> Unit>("onAdBreakEnd") { it(data) }

  fun onAdProgress(data: AdProgressInfo) =
    emitEvent<(AdProgressInfo) -> Unit>("onAdProgress") { it(data) }

  fun onAdStart(data: AdInfo) =
    emitEvent<(AdInfo) -> Unit>("onAdStart") { it(data) }

  fun onAdComplete(data: AdInfo) =
    emitEvent<(AdInfo) -> Unit>("onAdComplete") { it(data) }

  fun onAdSkipped(data: AdInfo) =
    emitEvent<(AdInfo) -> Unit>("onAdSkipped") { it(data) }

  fun onAdClicked() =
    emitEvent<() -> Unit>("onAdClicked") { it() }

  fun onAdError(data: AdErrorEvent) =
    emitEvent<(AdErrorEvent) -> Unit>("onAdError") { it(data) }

  fun onAllAdsCompleted() =
    emitEvent<() -> Unit>("onAllAdsCompleted") { it() }

  fun onAdStateChange(state: VideoAdState) =
    emitEvent<(VideoAdState) -> Unit>("onAdStateChange") { it(state) }

  companion object {
    const val TAG = "HybridVideoPlayerEventEmitter"
  }
}
