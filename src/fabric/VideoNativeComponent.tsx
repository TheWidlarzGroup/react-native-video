import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import type { HostComponent, ViewProps } from 'react-native';

import type { Float, Int32, WithDefault, DirectEventHandler, Double } from 'react-native/Libraries/Types/CodegenTypes';

type Headers = ReadonlyArray<Readonly<{
  key: string;
  value: string;
}>>

type VideoSrc = Readonly<{
  uri?: string;
  isNetwork?: boolean;
  isAsset?: boolean;
  shouldCache?: boolean;
  type?: string;
  mainVer?: Int32;
  patchVer?: Int32;
  requestHeaders?: Headers;
  startTime?: Float;
  endTime?: Float;
}>


export type Filter = WithDefault<'None' |
'CIColorInvert' |
'CIColorMonochrome' |
'CIColorPosterize' |
'CIFalseColor' |
'CIMaximumComponent' |
'CIMinimumComponent' |
'CIPhotoEffectChrome' |
'CIPhotoEffectFade' |
'CIPhotoEffectInstant' |
'CIPhotoEffectMono' |
'CIPhotoEffectNoir' |
'CIPhotoEffectProcess' |
'CIPhotoEffectTonal' |
'CIPhotoEffectTransfer' |
'CISepiaTone', 'None'>;

export type DrmType = WithDefault<'widevine' | 'playready' | 'clearkey' | 'fairplay', 'widevine'>;

type Drm = Readonly<{
  drmType?: DrmType;
  licenseServer?: string;
  headers?: Headers;
  contentId?: string; // ios
  certificateUrl?: string; // ios
  base64Certificate?: boolean; // ios default: false
  useExternalGetLicense?: boolean; // ios
}>

type TextTracks = ReadonlyArray<Readonly<{
  title: string;
  language: string;
  type: string;
  uri: string;
}>>

type TextTrackType = WithDefault<'system' | 'disabled' | 'title' | 'language' | 'index', 'system'>;

type SelectedTextTrack = Readonly<{
  selectedTextType?: TextTrackType;
  value?: string;
  index?: Int32;
}>

type AudioTrackType = WithDefault<'system' | 'disabled' | 'title' | 'language' | 'index', 'system'>;

type SelectedAudioTrack = Readonly<{
  selectedAudioType?: AudioTrackType;
  value?: string;
  index?: Int32;
}>

export type Seek = Readonly<{
  time: Float;
  tolerance?: Float;
}>

type BufferConfig = Readonly<{
  minBufferMs?: Float;
  maxBufferMs?: Float;
  bufferForPlaybackMs?: Float;
  bufferForPlaybackAfterRebufferMs?: Float;
  maxHeapAllocationPercent?: Float;
  minBackBufferMemoryReservePercent?: Float;
  minBufferMemoryReservePercent?: Float;
}>

type SelectedVideoTrack = Readonly<{
  type?: WithDefault<'auto' | 'disabled' | 'resolution' | 'index', 'auto'>
  value?: Int32;
}>

type SubtitleStyle = Readonly<{
  fontSize?: Float;
  paddingTop?: WithDefault<Float, 0>;
  paddingBottom?: WithDefault<Float, 0>;
  paddingLeft?: WithDefault<Float, 0>;
  paddingRight?: WithDefault<Float, 0>;
}>

export type OnLoadData = Readonly<{
  currentTime: Float;
  duration: Float;
  naturalSize: Readonly<{
    width: Float;
    height: Float;
    orientation: string;
  }>;
}>

export type OnLoadStartData = Readonly<{
  isNetwork: boolean;
  type: string;
  uri: string;
}>

export type OnBufferData = Readonly<{ isBuffering: boolean }>;


export type OnProgressData = Readonly<{
  currentTime: Float;
  playableDuration: Float;
  seekableDuration: Float;
}>

export type OnBandwidthUpdateData = Readonly<{
  bitrate: Int32;
}>;

export type OnSeekData = Readonly<{
  currentTime: Float;
  seekTime: Float;
}>

export type OnPlaybackStateChangedData = Readonly<{
  isPlaying: boolean;
}>

export type OnTimedMetadataData = Readonly<{}>

export type OnPlaybackData = Readonly<{
  playbackRate: Float;
}>;

export type OnExternalPlaybackChangeData = Readonly<{
  isExternalPlaybackActive: boolean;
}>

export type OnGetLicenseData = Readonly<{
  licenseUrl: string;
  contentId: string;
  spcBase64: string;
}>

export type OnPictureInPictureStatusChangedData = Readonly<{
  isActive: boolean;
}>

export type OnReceiveAdEventData = Readonly<{
  event: string;
}>

export type OnVideoErrorData = Readonly<{
  error: string;
}>

export type OnAudioFocusChangedData = Readonly<{
  hasFocus: boolean;
}>

export interface VideoNativeProps extends ViewProps {
  src: VideoSrc;
  drm?: Drm;
  adTagUrl?: string;
  allowsExternalPlayback?: boolean; // ios, true
  maxBitRate?: Float;
  resizeMode?: WithDefault<'none' | 'contain' | 'cover' | 'stretch', 'none'>;
  repeat?: boolean;
  automaticallyWaitsToMinimizeStalling?: boolean
  textTracks?: TextTracks;
  selectedTextTrack?: SelectedTextTrack;
  selectedAudioTrack?: SelectedAudioTrack;
  paused?: boolean;
  muted?: boolean;
  controls?: boolean;
  filter?: Filter;
  filterEnabled?: boolean;
  volume?: Float; // default 1.0
  playInBackground?: boolean;
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  preferredForwardBufferDuration?: Float; //ios, 0
  playWhenInactive?: boolean; // ios, false
  pictureInPicture?: boolean; // ios, false
  ignoreSilentSwitch?: WithDefault<'inherit' | 'ignore' | 'obey', 'inherit'>; // ios, 'inherit'
  mixWithOthers?: WithDefault<'inherit' | 'mix' | 'duck', 'inherit'>; // ios, 'inherit'
  rate?: Float;
  fullscreen?: boolean; // ios, false
  fullscreenAutorotate?: boolean;
  fullscreenOrientation?: WithDefault<'all' | 'landscape' | 'portrait', 'all'>;
  progressUpdateInterval?: Float;
  restoreUserInterfaceForPIPStopCompletionHandler?: boolean;
  localSourceEncryptionKeyScheme?: string;

  backBufferDurationMs?: Int32; // Android
  bufferConfig?: BufferConfig; // Android
  contentStartTime?: Int32; // Android
  currentPlaybackTime?: Double; // Android
  disableDisconnectError?: boolean; // Android
  focusable?: boolean; 	// Android
  hideShutterView?: boolean; //	Android
  minLoadRetryCount?: Int32;	// Android
  reportBandwidth?: boolean; //Android
  selectedVideoTrack?: SelectedVideoTrack; // android
  subtitleStyle?: SubtitleStyle // android
  trackId?: string; // Android
  useTextureView?: boolean;	// Android
  useSecureView?: boolean;	// Android

  onVideoLoad?: DirectEventHandler<OnLoadData>;
  onVideoLoadStart?: DirectEventHandler<OnLoadStartData>;
  onVideoBuffer?: DirectEventHandler<OnBufferData>;
  onVideoError?: DirectEventHandler<OnVideoErrorData>;
  onVideoProgress?: DirectEventHandler<OnProgressData>;
  onBandwidthUpdate?: DirectEventHandler<OnBandwidthUpdateData>
  onVideoSeek?: DirectEventHandler<OnSeekData>;
  onVideoEnd?: DirectEventHandler<Readonly<{}>>; // all
  onTimedMetadata?: DirectEventHandler<OnTimedMetadataData>; // ios, android
  onVideoAudioBecomingNoisy?: DirectEventHandler<Readonly<{}>>;
  onVideoFullscreenPlayerWillPresent?: DirectEventHandler<Readonly<{}>>; // ios, android
  onVideoFullscreenPlayerDidPresent?: DirectEventHandler<Readonly<{}>>;  // ios, android
  onVideoFullscreenPlayerWillDismiss?: DirectEventHandler<Readonly<{}>>;  // ios, android
  onVideoFullscreenPlayerDidDismiss?: DirectEventHandler<Readonly<{}>>;  // ios, android
  onReadyForDisplay?: DirectEventHandler<Readonly<{}>>;
  onPlaybackRateChange?: DirectEventHandler<OnPlaybackData>; // all
  onVideoExternalPlaybackChange?: DirectEventHandler<OnExternalPlaybackChangeData>;
  onGetLicense?: DirectEventHandler<OnGetLicenseData>;
  onPictureInPictureStatusChanged?: DirectEventHandler<OnPictureInPictureStatusChangedData>;
  onRestoreUserInterfaceForPictureInPictureStop?: DirectEventHandler<Readonly<{}>>;
  onReceiveAdEvent?: DirectEventHandler<OnReceiveAdEventData>;
  onVideoPlaybackStateChanged?: DirectEventHandler<OnPlaybackStateChangedData>; // android only
  onVideoIdle?: DirectEventHandler<{}>; // android only (nowhere in document, so do not use as props. just type declaration)
  onAudioFocusChanged?: DirectEventHandler<OnAudioFocusChangedData>; // android only (nowhere in document, so do not use as props. just type declaration)
  // @todo: fix type
  // onAudioTracks: DirectEventHandler<any>; // android
  // onTextTracks: DirectEventHandler<any>; // android
  // onVideoTracks: DirectEventHandler<any>; // android
  // onTimedMetadata: DirectEventHandler<any>; // android
}

export type VideoComponentType = HostComponent<VideoNativeProps>
export interface NativeCommands {
  save: (viewRef: React.ElementRef<VideoComponentType>) => void;
  seek: (viewRef: React.ElementRef<VideoComponentType>, time: Float, tolerance?: Float) => void;
  setLicenseResult: (viewRef: React.ElementRef<VideoComponentType>, result: string) => void;
  setLicenseResultError: (viewRef: React.ElementRef<VideoComponentType>, error: string) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'save',
    'seek',
    'setLicenseResult',
    'setLicenseResultError',
  ],
});

export default codegenNativeComponent<VideoNativeProps>('RNCVideo') as VideoComponentType;


