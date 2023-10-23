import type {
  OnBandwidthUpdateData,
  OnBufferData,
  OnLoadData,
  OnLoadStartData,
  OnProgressData,
  OnSeekData,
  OnPlaybackData,
  OnExternalPlaybackChangeData,
  OnPictureInPictureStatusChangedData,
  OnReceiveAdEventData,
  OnVideoErrorData,
  OnPlaybackStateChangedData,
  OnAudioFocusChangedData,
  OnTimedMetadataData,
  OnAudioTracksData,
  OnTextTracksData,
  OnVideoTracksData,
} from '../VideoNativeComponent';

export interface ReactVideoEvents {
  onAudioBecomingNoisy?: () => void; //Android, iOS
  onAudioFocusChanged?: (e: OnAudioFocusChangedData) => void; // Android
  onIdle?: () => void; // Android
  onBandwidthUpdate?: (e: OnBandwidthUpdateData) => void; //Android
  onBuffer?: (e: OnBufferData) => void; //Android, iOS
  onEnd?: () => void; //All
  onError?: (e: OnVideoErrorData) => void; //Android, iOS
  onExternalPlaybackChange?: (e: OnExternalPlaybackChangeData) => void; //iOS
  onFullscreenPlayerWillPresent?: () => void; //Android, iOS
  onFullscreenPlayerDidPresent?: () => void; //Android, iOS
  onFullscreenPlayerWillDismiss?: () => void; //Android, iOS
  onFullscreenPlayerDidDismiss?: () => void; //Android, iOS
  onLoad?: (e: OnLoadData) => void; //All
  onLoadStart?: (e: OnLoadStartData) => void; //All
  onPictureInPictureStatusChanged?: (
    e: OnPictureInPictureStatusChangedData,
  ) => void; //iOS
  onPlaybackRateChange?: (e: OnPlaybackData) => void; //All
  onProgress?: (e: OnProgressData) => void; //All
  onReadyForDisplay?: () => void; //Android, iOS
  onReceiveAdEvent?: (e: OnReceiveAdEventData) => void; //Android, iOS
  onRestoreUserInterfaceForPictureInPictureStop?: () => void; //iOS
  onSeek?: (e: OnSeekData) => void; //Android, iOS, Windows UWP
  onPlaybackStateChanged?: (e: OnPlaybackStateChangedData) => void; // Android, iOS
  onTimedMetadata?: (e: OnTimedMetadataData) => void; //Android, iOS
  onAudioTracks?: (e: OnAudioTracksData) => void; // Android
  onTextTracks?: (e: OnTextTracksData) => void; //Android
  onVideoTracks?: (e: OnVideoTracksData) => void; //Android
}
