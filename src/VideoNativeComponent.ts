/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/ban-types */
import type {HostComponent, ViewProps} from 'react-native';
import {NativeModules} from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import type {
  DirectEventHandler,
  Double,
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

// -------- There are types for native component (future codegen) --------
// if you are looking for types for react component, see src/types/video.ts

type Headers = ReadonlyArray<
  Readonly<{
    key: string;
    value: string;
  }>
>;

type VideoSrc = Readonly<{
  uri?: string;
  isNetwork?: boolean;
  isAsset?: boolean;
  shouldCache?: boolean;
  type?: string;
  mainVer?: Int32;
  patchVer?: Int32;
  requestHeaders?: Headers;
  startPosition?: Float;
  cropStart?: Float;
  cropEnd?: Float;
  title?: string;
  subtitle?: string;
  description?: string;
  customImageUri?: string;
}>;

export type Filter = WithDefault<
  | 'None'
  | 'CIColorInvert'
  | 'CIColorMonochrome'
  | 'CIColorPosterize'
  | 'CIFalseColor'
  | 'CIMaximumComponent'
  | 'CIMinimumComponent'
  | 'CIPhotoEffectChrome'
  | 'CIPhotoEffectFade'
  | 'CIPhotoEffectInstant'
  | 'CIPhotoEffectMono'
  | 'CIPhotoEffectNoir'
  | 'CIPhotoEffectProcess'
  | 'CIPhotoEffectTonal'
  | 'CIPhotoEffectTransfer'
  | 'CISepiaTone',
  'None'
>;

export type DrmType = WithDefault<
  'widevine' | 'playready' | 'clearkey' | 'fairplay',
  'widevine'
>;

type DebugConfig = Readonly<{
  enable?: boolean;
  thread?: boolean;
}>;

type Drm = Readonly<{
  drmType?: DrmType;
  licenseServer?: string;
  headers?: Headers;
  contentId?: string; // ios
  certificateUrl?: string; // ios
  base64Certificate?: boolean; // ios default: false
  useExternalGetLicense?: boolean; // ios
}>;

type TextTracks = ReadonlyArray<
  Readonly<{
    title: string;
    language: string;
    type: string;
    uri: string;
  }>
>;

type TextTrackType = WithDefault<
  'system' | 'disabled' | 'title' | 'language' | 'index',
  'system'
>;

type SelectedTextTrack = Readonly<{
  selectedTextType?: TextTrackType;
  value?: string;
  index?: Int32;
}>;

type AudioTrackType = WithDefault<
  'system' | 'disabled' | 'title' | 'language' | 'index',
  'system'
>;

type SelectedAudioTrack = Readonly<{
  selectedAudioType?: AudioTrackType;
  value?: string;
  index?: Int32;
}>;

export type Seek = Readonly<{
  time: Float;
  tolerance?: Float;
}>;

type BufferConfig = Readonly<{
  minBufferMs?: Float;
  maxBufferMs?: Float;
  bufferForPlaybackMs?: Float;
  bufferForPlaybackAfterRebufferMs?: Float;
  maxHeapAllocationPercent?: Float;
  minBackBufferMemoryReservePercent?: Float;
  minBufferMemoryReservePercent?: Float;
}>;

type VideoTrackType = WithDefault<
  'auto' | 'disabled' | 'resolution' | 'index',
  'auto'
>;

type SelectedVideoTrack = Readonly<{
  selectedVideoType?: VideoTrackType;
  value?: Int32;
}>;

type SubtitleStyle = Readonly<{
  fontSize?: Float;
  paddingTop?: WithDefault<Float, 0>;
  paddingBottom?: WithDefault<Float, 0>;
  paddingLeft?: WithDefault<Float, 0>;
  paddingRight?: WithDefault<Float, 0>;
}>;

export type OnLoadData = Readonly<{
  currentTime: Float;
  duration: Float;
  naturalSize: Readonly<{
    width: Float;
    height: Float;
    orientation: WithDefault<'portrait' | 'landscape', 'portrait'>;
  }>;
  // we cannot use array type right now. it can be used upper than RN 0.73
  audioTracks: {};
  textTracks: {};
}>;

export type OnLoadStartData = Readonly<{
  isNetwork: boolean;
  type: string;
  uri: string;
}>;

export type OnVideoAspectRatioData = Readonly<{
  width: Float;
  height: Float;
}>;

export type OnBufferData = Readonly<{isBuffering: boolean}>;

export type OnProgressData = Readonly<{
  currentTime: Float;
  playableDuration: Float;
  seekableDuration: Float;
}>;

export type OnBandwidthUpdateData = Readonly<{
  bitrate: Int32;
  width?: Float;
  height?: Float;
  trackId?: Int32;
}>;

export type OnSeekData = Readonly<{
  currentTime: Float;
  seekTime: Float;
  finished: boolean;
}>;

export type OnPlaybackStateChangedData = Readonly<{
  isPlaying: boolean;
}>;

export type OnTimedMetadataData = Readonly<{}>;
// export type OnTimedMetadataData = Readonly<{
//   metadata: ReadonlyArray<
//     Readonly<{
//       value?: string;
//       identifier: string;
//     }>
//   >;
// }>;

export type OnAudioTracksData = Readonly<{}>;
// export type OnAudioTracksData = Readonly<{
//   audioTracks: ReadonlyArray<
//     Readonly<{
//       index: Int32;
//       title?: string;
//       language?: string;
//       bitrate?: Float;
//       type?: string;
//       selected?: boolean;
//     }>
//   >;
// }>;

export type OnTextTracksData = Readonly<{}>;
// export type OnTextTracksData = Readonly<{
//   textTracks: ReadonlyArray<
//     Readonly<{
//       index?: Int32;
//       title?: string;
//       language?: string;
//       /**
//        * iOS only supports VTT, Android supports all 3
//        */
//       // string
//       // type?: OnTextTracksTypeData;
//       type?: string;
//       selected?: boolean;
//     }>
//   >;
// }>;

export type OnVideoTracksData = Readonly<{}>;
// export type OnVideoTracksData = Readonly<{
//   videoTracks: ReadonlyArray<
//     Readonly<{
//       trackId: Int32;
//       codecs?: string;
//       width?: Float;
//       height?: Float;
//       bitrate?: Float;
//       selected?: boolean;
//     }>
//   >;
// }>;

export type OnPlaybackData = Readonly<{
  playbackRate: Float;
}>;

export type OnVolumeChangeData = Readonly<{
  volume: Float;
}>;

export type OnExternalPlaybackChangeData = Readonly<{
  isExternalPlaybackActive: boolean;
}>;

export type OnGetLicenseData = Readonly<{
  licenseUrl: string;
  contentId: string;
  spcBase64: string;
}>;

export type OnPictureInPictureStatusChangedData = Readonly<{
  isActive: boolean;
}>;

export type OnReceiveAdEventData = Readonly<{
  // for now we cannot use Record type for codegen.
  // data?: Record<string, string>;
  event: WithDefault< /**
  * iOS only: Fired the first time each ad break ends. Applications must reenable seeking when this occurs (only used for dynamic ad insertion).
  */'AD_BREAK_ENDED' |
 /**
  * Fires when an ad rule or a VMAP ad break would have played if autoPlayAdBreaks is false.
  */
 'AD_BREAK_READY'|
 /**
  * iOS only: Fired first time each ad break begins playback. If an ad break is watched subsequent times this will not be fired. Applications must disable seeking when this occurs (only used for dynamic ad insertion).
  */
'AD_BREAK_STARTED' |
 /**
  * Android only: Fires when the ad has stalled playback to buffer.
  */
 'AD_BUFFERING' |
 /**
  * Android only: Fires when the ad is ready to play without buffering, either at the beginning of the ad or after buffering completes.
  */
 'AD_CAN_PLAY' |
 /**
  * Android only: Fires when an ads list is loaded.
  */
 'AD_METADATA' |
 /**
  * iOS only: Fired every time the stream switches from advertising or slate to content. This will be fired even when an ad is played a second time or when seeking into an ad (only used for dynamic ad insertion).
  */
 'AD_PERIOD_ENDED' |
 /**
  * iOS only: Fired every time the stream switches from content to advertising or slate. This will be fired even when an ad is played a second time or when seeking into an ad (only used for dynamic ad insertion).
  */
 'AD_PERIOD_STARTED' |
 /**
  * Android only: Fires when the ad's current time value changes. The event `data` will be populated with an AdProgressData object.
  */
 'AD_PROGRESS' |
 /**
  * Fires when the ads manager is done playing all the valid ads in the ads response, or when the response doesn't return any valid ads.
  */
'ALL_ADS_COMPLETED' |
 /**
  * Fires when the ad is clicked.
  */
 'CLICK' |
 /**
  * Fires when the ad completes playing.
  */
 'COMPLETED' |
 /**
  * Android only: Fires when content should be paused. This usually happens right before an ad is about to cover the content.
  */
 'CONTENT_PAUSE_REQUESTED' |
 /**
  * Android only: Fires when content should be resumed. This usually happens when an ad finishes or collapses.
  */
 'CONTENT_RESUME_REQUESTED' |
 /**
  * iOS only: Cuepoints changed for VOD stream (only used for dynamic ad insertion).
  */
 'CUEPOINTS_CHANGED' |
 /**
  * Android only: Fires when the ad's duration changes.
  */
 'DURATION_CHANGE' |
 /**
  * Fires when an error is encountered and the ad can't be played.
  */
 'ERROR' |
 /**
  * Fires when the ad playhead crosses first quartile.
  */
 'FIRST_QUARTILE' |
 /**
  * Android only: Fires when the impression URL has been pinged.
  */
 'IMPRESSION' |
 /**
  * Android only: Fires when an ad triggers the interaction callback. Ad interactions contain an interaction ID string in the ad data.
  */
  'INTERACTION' |
 /**
  * Android only: Fires when the displayed ad changes from linear to nonlinear, or the reverse.
  */
 'LINEAR_CHANGED' |
 /**
  * Fires when ad data is available.
  */
  'LOADED' |
 /**
  * Fires when a non-fatal error is encountered. The user need not take any action since the SDK will continue with the same or next ad playback depending on the error situation.
  */
 'LOG' |
 /**
  * Fires when the ad playhead crosses midpoint.
  */
  'MIDPOINT' |
 /**
  * Fires when the ad is paused.
  */
  'PAUSED' |
 /**
  * Fires when the ad is resumed.
  */
  'RESUMED' |
 /**
  * Android only: Fires when the displayed ads skippable state is changed.
  */
  'SKIPPABLE_STATE_CHANGED' |
 /**
  * Fires when the ad is skipped by the user.
  */
  'SKIPPED' |
 /**
  * Fires when the ad starts playing.
  */
  'STARTED' |
 /**
  * iOS only: Stream request has loaded (only used for dynamic ad insertion).
  */
  'STREAM_LOADED' |
 /**
  * iOS only: Fires when the ad is tapped.
  */
  'TAPPED' |
 /**
  * Fires when the ad playhead crosses third quartile.
  */
  'THIRD_QUARTILE' |
 /**
  * iOS only: An unknown event has fired
  */
  'UNKNOWN' |
 /**
  * Android only: Fires when the ad is closed by the user.
  */
  'USER_CLOSE' |
 /**
  * Android only: Fires when the non-clickthrough portion of a video ad is clicked.
  */
  'VIDEO_CLICKED' |
 /**
  * Android only: Fires when a user clicks a video icon.
  */
  'VIDEO_ICON_CLICKED' |
 /**
  * Android only: Fires when the ad volume has changed.
  */
  'VOLUME_CHANGED' |
 /**
  * Android only: Fires when the ad volume has been muted.
  */
  'VOLUME_MUTED', 'AD_BREAK_ENDED'>
}>;

export type OnVideoErrorData = Readonly<{
  error: Readonly<{
    errorString?: string; // android
    errorException?: string; // android
    errorStackTrace?: string; // android
    errorCode?: string; // android
    error?: string; // ios
    code?: Int32; // ios
    localizedDescription?: string; // ios
    localizedFailureReason?: string; // ios
    localizedRecoverySuggestion?: string; // ios
    domain?: string; // ios
  }>;
  target?: Int32; // ios
}>;

export type OnAudioFocusChangedData = Readonly<{
  hasAudioFocus: boolean;
}>;

export interface VideoNativeProps extends ViewProps {
  src?: VideoSrc;
  drm?: Drm;
  adTagUrl?: string;
  allowsExternalPlayback?: boolean; // ios, true
  maxBitRate?: Float;
  resizeMode?: WithDefault<'none' | 'contain' | 'cover' | 'stretch', 'none'>;
  repeat?: boolean;
  automaticallyWaitsToMinimizeStalling?: boolean;
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
  debug?: DebugConfig;

  backBufferDurationMs?: Int32; // Android
  bufferConfig?: BufferConfig; // Android
  contentStartTime?: Int32; // Android
  currentPlaybackTime?: Double; // Android
  disableDisconnectError?: boolean; // Android
  focusable?: boolean; // Android
  hideShutterView?: boolean; //	Android
  minLoadRetryCount?: Int32; // Android
  reportBandwidth?: boolean; //Android
  selectedVideoTrack?: SelectedVideoTrack; // android
  subtitleStyle?: SubtitleStyle; // android
  trackId?: string; // Android
  useTextureView?: boolean; // Android
  useSecureView?: boolean; // Android

  onVideoLoad?: DirectEventHandler<OnLoadData>;
  onVideoLoadStart?: DirectEventHandler<OnLoadStartData>;
  // todo
  onVideoAspectRatio?: DirectEventHandler<OnVideoAspectRatioData>;
  onVideoBuffer?: DirectEventHandler<OnBufferData>;
  onVideoError?: DirectEventHandler<OnVideoErrorData>;
  onVideoProgress?: DirectEventHandler<OnProgressData>;
  onVideoBandwidthUpdate?: DirectEventHandler<OnBandwidthUpdateData>;
  onVideoSeek?: DirectEventHandler<OnSeekData>;
  onVideoEnd?: DirectEventHandler<Readonly<{}>>; // all
  onVideoAudioBecomingNoisy?: DirectEventHandler<Readonly<{}>>;
  onVideoFullscreenPlayerWillPresent?: DirectEventHandler<Readonly<{}>>; // ios, android
  onVideoFullscreenPlayerDidPresent?: DirectEventHandler<Readonly<{}>>; // ios, android
  onVideoFullscreenPlayerWillDismiss?: DirectEventHandler<Readonly<{}>>; // ios, android
  onVideoFullscreenPlayerDidDismiss?: DirectEventHandler<Readonly<{}>>; // ios, android
  onReadyForDisplay?: DirectEventHandler<Readonly<{}>>;
  onPlaybackRateChange?: DirectEventHandler<OnPlaybackData>; // all
  // todo
  onVolumeChange?: DirectEventHandler<OnVolumeChangeData>; // android, ios
  onVideoExternalPlaybackChange?: DirectEventHandler<OnExternalPlaybackChangeData>;
  onGetLicense?: DirectEventHandler<OnGetLicenseData>;
  onPictureInPictureStatusChanged?: DirectEventHandler<OnPictureInPictureStatusChangedData>;
  onRestoreUserInterfaceForPictureInPictureStop?: DirectEventHandler<
    Readonly<{}>
  >;
  onReceiveAdEvent?: DirectEventHandler<OnReceiveAdEventData>;
  onVideoPlaybackStateChanged?: DirectEventHandler<OnPlaybackStateChangedData>; // android only
  onVideoIdle?: DirectEventHandler<{}>; // android only (nowhere in document, so do not use as props. just type declaration)
  onAudioFocusChanged?: DirectEventHandler<OnAudioFocusChangedData>; // android only (nowhere in document, so do not use as props. just type declaration)
  // // @todo: fix type
  onTimedMetadata?: DirectEventHandler<OnTimedMetadataData>; // ios, android
  onAudioTracks: DirectEventHandler<OnAudioTracksData>; // android
  onTextTracks: DirectEventHandler<OnTextTracksData>; // android
  onVideoTracks: DirectEventHandler<OnVideoTracksData>; // android
}

export type VideoComponentType = HostComponent<VideoNativeProps>;

export type VideoSaveData = {
  uri: string;
};

export interface VideoManagerType {
  save: (option: object, reactTag: number) => Promise<VideoSaveData>;
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
  getWidevineLevel: () => Promise<Float>;
  isCodecSupported: (
    mimeType: string,
    width: Float,
    height: Float,
  ) => Promise<'unsupported' | 'hardware' | 'software'>;
  isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}

export const VideoManager = NativeModules.VideoManager as VideoManagerType;
export const VideoDecoderProperties =
  NativeModules.VideoDecoderProperties as VideoDecoderPropertiesType;

export interface NativeCommands {
  save: (viewRef: React.ElementRef<VideoComponentType>) => void;
  seek: (
    viewRef: React.ElementRef<VideoComponentType>,
    time: Float,
    tolerance?: Float,
  ) => void;
  setLicenseResult: (
    viewRef: React.ElementRef<VideoComponentType>,
    result: string,
  ) => void;
  setLicenseResultError: (
    viewRef: React.ElementRef<VideoComponentType>,
    error: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'save',
    'seek',
    'setLicenseResult',
    'setLicenseResultError',
  ],
});

export default codegenNativeComponent<VideoNativeProps>(
  'RNCVideo',
) as VideoComponentType;
