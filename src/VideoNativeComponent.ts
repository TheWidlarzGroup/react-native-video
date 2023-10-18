import type {
  HostComponent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native';
import type {
  Drm,
  DebugConfig,
  Headers,
  TextTracks,
  SelectedTextTrack,
  SelectedVideoTrack,
  SubtitleStyle,
  BufferConfig,
  SelectedAudioTrack,
} from './types/video';
import {NativeModules, requireNativeComponent} from 'react-native';
import type {
  OnAudioFocusChangedData,
  OnAudioTracksData,
  OnBandwidthUpdateData,
  OnVideoBufferData,
  OnExternalPlaybackChangeData,
  OnGetLicenseData,
  OnLoadData,
  OnLoadStartData,
  OnPictureInPictureStatusChangedData,
  OnPlaybackData,
  OnPlaybackStateChangedData,
  OnProgressData,
  OnReceiveAdEventData,
  OnSeekData,
  OnTextTracksData,
  OnTimedMetadataData,
  OnVideoAspectRatioData,
  OnVideoErrorData,
  OnVideoTracksData,
} from './types/events';
import type ResizeMode from './types/ResizeMode';
import type FilterType from 'react-native-video/src/types/FilterType';

// -------- There are types for native component (future codegen) --------
// if you are looking for types for react component, see src/types/video.ts

type VideoSrc = Readonly<{
  uri?: string;
  isNetwork?: boolean;
  isAsset?: boolean;
  shouldCache?: boolean;
  type?: string;
  mainVer?: number;
  patchVer?: number;
  requestHeaders?: Headers;
  startTime?: number;
  endTime?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  customImageUri?: string;
}>;

export interface VideoNativeProps extends ViewProps {
  src?: VideoSrc;
  drm?: Drm;
  adTagUrl?: string;
  allowsExternalPlayback?: boolean; // ios, true
  maxBitRate?: number;
  resizeMode?: ResizeMode;
  repeat?: boolean;
  automaticallyWaitsToMinimizeStalling?: boolean;
  textTracks?: TextTracks;
  selectedTextTrack?: SelectedTextTrack;
  selectedAudioTrack?: SelectedAudioTrack;
  paused?: boolean;
  muted?: boolean;
  controls?: boolean;
  filter?: FilterType;
  filterEnabled?: boolean;
  volume?: number; // default 1.0
  playInBackground?: boolean;
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  preferredForwardBufferDuration?: number; //ios, 0
  playWhenInactive?: boolean; // ios, false
  pictureInPicture?: boolean; // ios, false
  ignoreSilentSwitch?: 'inherit' | 'ignore' | 'obey'; // ios, 'inherit'
  mixWithOthers?: 'inherit' | 'mix' | 'duck'; // ios, 'inherit'
  rate?: number;
  fullscreen?: boolean; // ios, false
  fullscreenAutorotate?: boolean;
  fullscreenOrientation?: 'all' | 'landscape' | 'portrait';
  progressUpdateInterval?: number;
  restoreUserInterfaceForPIPStopCompletionHandler?: boolean;
  localSourceEncryptionKeyScheme?: string;
  debug?: DebugConfig;

  backBufferDurationMs?: number; // Android
  bufferConfig?: BufferConfig; // Android
  contentStartTime?: number; // Android
  currentPlaybackTime?: number; // Android
  disableDisconnectError?: boolean; // Android
  focusable?: boolean; // Android
  hideShutterView?: boolean; //	Android
  minLoadRetryCount?: number; // Android
  reportBandwidth?: boolean; //Android
  selectedVideoTrack?: SelectedVideoTrack; // android
  subtitleStyle?: SubtitleStyle; // android
  trackId?: string; // Android
  useTextureView?: boolean; // Android
  useSecureView?: boolean; // Android
  onVideoLoad?: (event: NativeSyntheticEvent<OnLoadData>) => void;
  onVideoLoadStart?: (event: NativeSyntheticEvent<OnLoadStartData>) => void;
  onVideoAspectRatio?: (
    event: NativeSyntheticEvent<OnVideoAspectRatioData>,
  ) => void;
  onVideoBuffer?: (event: NativeSyntheticEvent<OnVideoBufferData>) => void;
  onVideoError?: (event: NativeSyntheticEvent<OnVideoErrorData>) => void;
  onVideoProgress?: (event: NativeSyntheticEvent<OnProgressData>) => void;
  onBandwidthUpdate?: (
    event: NativeSyntheticEvent<OnBandwidthUpdateData>,
  ) => void;
  onVideoSeek?: (event: NativeSyntheticEvent<OnSeekData>) => void;
  onVideoEnd?: (event: NativeSyntheticEvent<Readonly<object>>) => void; // all
  onVideoAudioBecomingNoisy?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void;
  onVideoFullscreenPlayerWillPresent?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void; // ios, android
  onVideoFullscreenPlayerDidPresent?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void; // ios, android
  onVideoFullscreenPlayerWillDismiss?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void; // ios, android
  onVideoFullscreenPlayerDidDismiss?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void; // ios, android
  onReadyForDisplay?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
  onPlaybackRateChange?: (event: NativeSyntheticEvent<OnPlaybackData>) => void; // all
  onVideoExternalPlaybackChange?: (
    event: NativeSyntheticEvent<OnExternalPlaybackChangeData>,
  ) => void;
  onGetLicense?: (event: NativeSyntheticEvent<OnGetLicenseData>) => void;
  onPictureInPictureStatusChanged?: (
    event: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>,
  ) => void;
  onRestoreUserInterfaceForPictureInPictureStop?: (
    event: NativeSyntheticEvent<Readonly<object>>,
  ) => void;
  onReceiveAdEvent?: (
    event: NativeSyntheticEvent<OnReceiveAdEventData>,
  ) => void;
  onVideoPlaybackStateChanged?: (
    event: NativeSyntheticEvent<OnPlaybackStateChangedData>,
  ) => void; // android only
  onVideoIdle?: (event: NativeSyntheticEvent<object>) => void; // android only (nowhere in document, so do not use as props. just type declaration)
  onAudioFocusChanged?: (
    event: NativeSyntheticEvent<OnAudioFocusChangedData>,
  ) => void; // android only (nowhere in document, so do not use as props. just type declaration)
  onTimedMetadata?: (event: NativeSyntheticEvent<OnTimedMetadataData>) => void; // ios, android
  onAudioTracks?: (event: NativeSyntheticEvent<OnAudioTracksData>) => void; // android
  onTextTracks?: (event: NativeSyntheticEvent<OnTextTracksData>) => void; // android
  onVideoTracks?: (event: NativeSyntheticEvent<OnVideoTracksData>) => void; // android
}

export type VideoComponentType = HostComponent<VideoNativeProps>;

export interface VideoManagerType {
  save: (reactTag: number) => Promise<void>;
  setPlayerPauseState: (paused: boolean, reactTag: number) => Promise<void>;
  setLicenseResult: (
    result: string,
    licenseUrl: string,
    reactTag: number,
  ) => Promise<void>;
  setLicenseResultError: (
    error: string,
    licenseUrl: string,
    reactTag: number,
  ) => Promise<void>;
}

export interface VideoDecoderPropertiesType {
  getWidevineLevel: () => Promise<number>;
  isCodecSupported: (
    mimeType: string,
    width: number,
    height: number,
  ) => Promise<'unsupported' | 'hardware' | 'software'>;
  isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}

export const VideoManager = NativeModules.VideoManager as VideoManagerType;
export const VideoDecoderProperties =
  NativeModules.VideoDecoderProperties as VideoDecoderPropertiesType;

export default requireNativeComponent<VideoNativeProps>(
  'RCTVideo',
) as VideoComponentType;
