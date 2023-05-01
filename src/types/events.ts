import type { OnBandwidthUpdateData, OnBufferData, OnLoadData, OnLoadStartData, OnProgressData, OnSeekData, OnPlaybackData, OnExternalPlaybackChangeData, OnPictureInPictureStatusChangedData, OnReceiveAdEventData, OnVideoErrorData, OnPlaybackStateChangedData, OnAudioFocusChangedData } from "src/fabric/VideoNativeComponent";

export interface ReactVideoEvents {
  onAudioBecomingNoisy?: () => void //Android, iOS
  onAudioTracks?: () => void // Android
  onAudioFocusChanged?: (e: OnAudioFocusChangedData) => void // Android
  onIdle?: () => void // Android
  onBandwidthUpdate?: (e: OnBandwidthUpdateData) => void //Android
  onBuffer?: (e: OnBufferData) => void //Android, iOS
  onEnd?: () => void //All
  onError?: (e: OnVideoErrorData) => void //Android, iOS
  onExternalPlaybackChange?: (e: OnExternalPlaybackChangeData) => void //iOS
  onFullscreenPlayerWillPresent?: () => void //Android, iOS
  onFullscreenPlayerDidPresent?: () => void //Android, iOS
  onFullscreenPlayerWillDismiss?: () => void //Android, iOS
  onFullscreenPlayerDidDismiss?: () => void //Android, iOS
  onLoad?: (e: OnLoadData) => void //All
  onLoadStart?: (e: OnLoadStartData) => void //All
  onPictureInPictureStatusChanged?: (e: OnPictureInPictureStatusChangedData) => void //iOS
  onPlaybackRateChange?: (e: OnPlaybackData) => void //All
  onProgress?: (e: OnProgressData) => void //All
  onReadyForDisplay?: () => void //Android, iOS, Web
  onReceiveAdEvent?: (e: OnReceiveAdEventData) => void //Android, iOS
  onRestoreUserInterfaceForPictureInPictureStop?: () => void //iOS
  onSeek?: (e: OnSeekData) => void //Android, iOS, Windows UWP
  onPlaybackStateChanged?: (e: OnPlaybackStateChangedData) => void // Android
  // @todo: fix type
  onTimedMetadata?: () => void //Android, iOS
  onTextTracks?: () => void //Android
  onVideoTracks?: () => void //Android
}
