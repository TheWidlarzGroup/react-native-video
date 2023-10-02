import type { ISO639_1 } from './language';
import type { ReactVideoEvents } from './events';
import type { StyleProp, ViewStyle } from 'react-native'

type Filter = | 'None'
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
              | 'CISepiaTone'



type Headers = Record<string, string>;

export type ReactVideoSource = Readonly<{
  uri?: string;
  isNetwork?: boolean;
  isAsset?: boolean;
  shouldCache?: boolean;
  type?: string;
  mainVer?: number;
  patchVer?: number;
  headers?: Headers;
  startTime?: number;
  endTime?: number;
}>;

export type ReactVideoDrm = Readonly<{
  type?: 'widevine' | 'playready' | 'clearkey' | 'fairplay';
  licenseServer?: string;
  headers?: Headers;
  contentId?: string; // ios
  certificateUrl?: string; // ios
  base64Certificate?: boolean; // ios default: false
  getLicense?: (licenseUrl: string, contentId: string, spcBase64: string) => void; // ios
}>

type BufferConfig = {
  minBufferMs?: number;
  maxBufferMs?: number;
  bufferForPlaybackMs?: number;
  bufferForPlaybackAfterRebufferMs?: number;
  maxHeapAllocationPercent?: number;
  minBackBufferMemoryReservePercent?: number;
  minBufferMemoryReservePercent?: number;
}

type SelectedTrack = {
  type: 'system' | 'disabled' | 'title' | 'language' | 'index';
  value?: string | number;
}

type SelectedVideoTrack = {
  type: 'auto' | 'disabled' | 'resolution' | 'index'
  value: number;
}

type SubtitleStyle = {
  fontSize?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
}

type TextTracks = {
  title: string;
  language: ISO639_1;
  type: | 'application/x-subrip'
        | 'application/ttml+xml'
        | 'text/vtt';
  uri: string;
}[]

export interface ReactVideoProps extends ReactVideoEvents {
  source: ReactVideoSource;
  drm?: ReactVideoDrm;
  style?: StyleProp<ViewStyle>;
  adTagUrl?: string; // iOS
  audioOnly?: boolean;
  automaticallyWaitsToMinimizeStalling?: boolean; // iOS
  backBufferDurationMs?: number; // Android
  bufferConfig?: BufferConfig; // Android
  contentStartTime?: number; // Android
  controls?: boolean;
  currentPlaybackTime?: number; // Android
  disableFocus?: boolean;
  disableDisconnectError?: boolean; // Android
  filter?: Filter; // iOS
  filterEnabled?:	boolean; // iOS
  focusable?: boolean; 	// Android
  fullscreen?: boolean; // iOS
  fullscreenAutorotate?: boolean; // iOS
  fullscreenOrientation?: 'all' | 'landscape' | 'portrait';	// iOS
  hideShutterView?: boolean; //	Android
  ignoreSilentSwitch?: 'inherit' | 'ignore' | 'obey'	// iOS
  minLoadRetryCount?: number;	// Android
  maxBitRate?: number;
  mixWithOthers?: 'inherit' | 'mix' | 'duck'; // iOS
  muted?: boolean;
  paused?: boolean;
  pictureInPicture?: boolean // iOS
  playInBackground?: boolean;
  playWhenInactive?: boolean // iOS
  poster?: string;
  posterResizeMode?: 'contain' | 'center' | 'cover' | 'none' | 'repeat' | 'stretch';
  preferredForwardBufferDuration?: number// iOS
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  progressUpdateInterval?: number;
  rate?: number;
  repeat?: boolean;
  reportBandwidth?: boolean; //Android
  resizeMode?: 'none' | 'contain' | 'cover' | 'stretch';
  selectedAudioTrack?: SelectedTrack;
  selectedTextTrack?: SelectedTrack;
  selectedVideoTrack?: SelectedVideoTrack; // android
  subtitleStyle?: SubtitleStyle // android
  textTracks?: TextTracks;
  trackId?: string; // Android
  useTextureView?: boolean;	// Android
  useSecureView?: boolean;	// Android
  volume?: number;
  localSourceEncryptionKeyScheme?: string;
}