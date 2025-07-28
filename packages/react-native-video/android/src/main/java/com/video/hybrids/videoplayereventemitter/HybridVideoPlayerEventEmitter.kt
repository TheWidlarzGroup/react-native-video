package com.margelo.nitro.video

class HybridVideoPlayerEventEmitter(): HybridVideoPlayerEventEmitterSpec() {
  override var onAudioBecomingNoisy: () -> Unit = {}

  override var onAudioFocusChange: (Boolean) -> Unit = {}

  override var onBandwidthUpdate: (BandwidthData) -> Unit = {}

  override var onBuffer: (Boolean) -> Unit = {}

  override var onControlsVisibleChange: (Boolean) -> Unit = {}

  override var onEnd: () -> Unit = {}

  override var onExternalPlaybackChange: (Boolean) -> Unit = {}

  override var onLoad: (onLoadData) -> Unit = {}

  override var onLoadStart: (onLoadStartData) -> Unit = {}

  override var onPlaybackStateChange: (onPlaybackStateChangeData) -> Unit = {}

  override var onPlaybackRateChange: (Double) -> Unit = {}

  override var onProgress: (onProgressData) -> Unit = {}

  override var onReadyToDisplay: () -> Unit = {}

  override var onSeek: (Double) -> Unit = {}

  override var onTimedMetadata: (TimedMetadata) -> Unit = {}

  override var onTextTrackDataChanged: (Array<String>) -> Unit = {}

  override var onTrackChange: (TextTrack?) -> Unit = {}

  override var onVolumeChange: (onVolumeChangeData) -> Unit = {}

  override var onStatusChange: (VideoPlayerStatus) -> Unit = {}
}
