import type {ISO639_1} from './language';
import type {ReactVideoEvents} from './events';
import type {
  ImageProps,
  StyleProp,
  ViewProps,
  ViewStyle,
  ImageRequireSource,
  ImageURISource,
  ImageStyle,
} from 'react-native';
import type {ReactNode} from 'react';
import type VideoResizeMode from './ResizeMode';
import type FilterType from './FilterType';
import type ViewType from './ViewType';

export type Headers = Record<string, string>;

export type EnumValues<T extends string | number> = T extends string
  ? `${T}` | T
  : T;

export type ReactVideoSourceProperties = {
  uri?: string;
  isNetwork?: boolean;
  isAsset?: boolean;
  isLocalAssetFile?: boolean;
  shouldCache?: boolean;
  type?: string;
  mainVer?: number;
  patchVer?: number;
  headers?: Headers;
  startPosition?: number;
  cropStart?: number;
  cropEnd?: number;
  contentStartTime?: number; // Android
  metadata?: VideoMetadata;
  drm?: Drm;
  cmcd?: Cmcd; // android
  textTracksAllowChunklessPreparation?: boolean;
  textTracks?: TextTracks;
  ad?: AdConfig;
  minLoadRetryCount?: number; // Android
  bufferConfig?: BufferConfig;
};

export type ReactVideoSource = Readonly<
  Omit<ReactVideoSourceProperties, 'uri'> & {
    uri?: string | NodeRequire;
  }
>;

export type ReactVideoPosterSource = ImageURISource | ImageRequireSource;

export type ReactVideoPoster = Omit<ImageProps, 'source'> & {
  // prevents giving source in the array
  source?: ReactVideoPosterSource;
};

export type VideoMetadata = Readonly<{
  title?: string;
  subtitle?: string;
  description?: string;
  artist?: string;
  imageUri?: string;
}>;

export type DebugConfig = Readonly<{
  enable?: boolean;
  thread?: boolean;
}>;

export enum DRMType {
  WIDEVINE = 'widevine',
  PLAYREADY = 'playready',
  CLEARKEY = 'clearkey',
  FAIRPLAY = 'fairplay',
}

export type AdConfig = Readonly<{
  adTagUrl?: string;
  adLanguage?: ISO639_1;
}>;

export type Drm = Readonly<{
  type?: DRMType;
  licenseServer?: string;
  headers?: Headers;
  contentId?: string; // ios
  certificateUrl?: string; // ios
  base64Certificate?: boolean; // ios default: false
  multiDrm?: boolean; // android
  localSourceEncryptionKeyScheme?: string; // ios
  /* eslint-disable @typescript-eslint/no-unused-vars */
  getLicense?: (
    spcBase64: string,
    contentId: string,
    licenseUrl: string,
    loadedLicenseUrl: string,
  ) => string | Promise<string>; // ios
  /* eslint-enable @typescript-eslint/no-unused-vars */
}>;

export enum CmcdMode {
  MODE_REQUEST_HEADER = 0,
  MODE_QUERY_PARAMETER = 1,
}
/**
 * Custom key names MUST carry a hyphenated prefix to ensure that there will not be a
 * namespace collision with future revisions to this specification. Clients SHOULD
 * use a reverse-DNS syntax when defining their own prefix.
 *
 * @see https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf CTA-5004 Specification (Page 6, Section 3.1)
 */
export type CmcdData = Record<`${string}-${string}`, string | number>;
export type CmcdConfiguration = Readonly<{
  mode?: CmcdMode; // default: MODE_QUERY_PARAMETER
  request?: CmcdData;
  session?: CmcdData;
  object?: CmcdData;
  status?: CmcdData;
}>;
export type Cmcd = boolean | CmcdConfiguration;

export enum BufferingStrategyType {
  DEFAULT = 'Default',
  DISABLE_BUFFERING = 'DisableBuffering',
  DEPENDING_ON_MEMORY = 'DependingOnMemory',
}

export type BufferConfigLive = {
  maxPlaybackSpeed?: number;
  minPlaybackSpeed?: number;
  maxOffsetMs?: number;
  minOffsetMs?: number;
  targetOffsetMs?: number;
};

export type BufferConfig = {
  minBufferMs?: number;
  maxBufferMs?: number;
  bufferForPlaybackMs?: number;
  bufferForPlaybackAfterRebufferMs?: number;
  backBufferDurationMs?: number; // Android
  maxHeapAllocationPercent?: number;
  minBackBufferMemoryReservePercent?: number;
  minBufferMemoryReservePercent?: number;
  initialBitrate?: number; // Android
  cacheSizeMB?: number;
  live?: BufferConfigLive;
};

export enum SelectedTrackType {
  SYSTEM = 'system',
  DISABLED = 'disabled',
  TITLE = 'title',
  LANGUAGE = 'language',
  INDEX = 'index',
}

export type SelectedTrack = {
  type: SelectedTrackType;
  value?: string | number;
};

export enum SelectedVideoTrackType {
  AUTO = 'auto',
  DISABLED = 'disabled',
  RESOLUTION = 'resolution',
  INDEX = 'index',
}

export type SelectedVideoTrack = {
  type: SelectedVideoTrackType;
  value?: string | number;
};

export type SubtitleStyle = {
  fontSize?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  opacity?: number;
  subtitlesFollowVideo?: boolean;
};

export enum TextTrackType {
  SUBRIP = 'application/x-subrip',
  TTML = 'application/ttml+xml',
  VTT = 'text/vtt',
}

export type TextTracks = {
  title: string;
  language: ISO639_1;
  type: TextTrackType;
  uri: string;
}[];

export type TextTrackSelectionType =
  | 'system'
  | 'disabled'
  | 'title'
  | 'language'
  | 'index';

export type SelectedTextTrack = Readonly<{
  type: TextTrackSelectionType;
  value?: string | number;
}>;

export type AudioTrackSelectionType =
  | 'system'
  | 'disabled'
  | 'title'
  | 'language'
  | 'index';

export type SelectedAudioTrack = Readonly<{
  type: AudioTrackSelectionType;
  value?: string | number;
}>;

export type Chapters = {
  title: string;
  startTime: number;
  endTime: number;
  uri?: string;
};

export enum FullscreenOrientationType {
  ALL = 'all',
  LANDSCAPE = 'landscape',
  PORTRAIT = 'portrait',
}

export enum IgnoreSilentSwitchType {
  INHERIT = 'inherit',
  IGNORE = 'ignore',
  OBEY = 'obey',
}

export enum MixWithOthersType {
  INHERIT = 'inherit',
  MIX = 'mix',
  DUCK = 'duck',
}

export enum PosterResizeModeType {
  CONTAIN = 'contain',
  CENTER = 'center',
  COVER = 'cover',
  NONE = 'none',
  REPEAT = 'repeat',
  STRETCH = 'stretch',
}

export type AudioOutput = 'speaker' | 'earpiece';

export type ControlsStyles = {
  hideSeekBar?: boolean;
  hideDuration?: boolean;
  hidePosition?: boolean;
  hidePlayPause?: boolean;
  hideForward?: boolean;
  hideRewind?: boolean;
  hideNext?: boolean;
  hidePrevious?: boolean;
  hideFullscreen?: boolean;
  hideNavigationBarOnFullScreenMode?: boolean;
  hideNotificationBarOnFullScreenMode?: boolean;
  hideSettingButton?: boolean;
  seekIncrementMS?: number;
  liveLabel?: string;
};

export interface ReactVideoRenderLoaderProps {
  source?: ReactVideoSource;
  style?: StyleProp<ImageStyle>;
  resizeMode?: EnumValues<VideoResizeMode>;
}

export interface ReactVideoProps extends ReactVideoEvents, ViewProps {
  source?: ReactVideoSource;
  /** @deprecated Use source.drm */
  drm?: Drm;
  style?: StyleProp<ViewStyle>;
  /** @deprecated Use source.ad.adTagUrl */
  adTagUrl?: string;
  /** @deprecated Use source.ad.adLanguage */
  adLanguage?: ISO639_1;
  audioOutput?: AudioOutput; // Mobile
  automaticallyWaitsToMinimizeStalling?: boolean; // iOS
  /** @deprecated Use source.bufferConfig */
  bufferConfig?: BufferConfig; // Android
  bufferingStrategy?: BufferingStrategyType;
  chapters?: Chapters[]; // iOS
  /** @deprecated Use source.contentStartTime */
  contentStartTime?: number; // Android
  controls?: boolean;
  currentPlaybackTime?: number; // Android
  disableFocus?: boolean;
  disableDisconnectError?: boolean; // Android
  filter?: EnumValues<FilterType>; // iOS
  filterEnabled?: boolean; // iOS
  focusable?: boolean; // Android
  fullscreen?: boolean; // iOS
  fullscreenAutorotate?: boolean; // iOS
  fullscreenOrientation?: EnumValues<FullscreenOrientationType>; // iOS
  hideShutterView?: boolean; //	Android
  ignoreSilentSwitch?: EnumValues<IgnoreSilentSwitchType>; // iOS
  /** @deprecated Use source.minLoadRetryCount */
  minLoadRetryCount?: number; // Android
  maxBitRate?: number;
  mixWithOthers?: EnumValues<MixWithOthersType>; // iOS
  muted?: boolean;
  paused?: boolean;
  enterPictureInPictureOnLeave?: boolean;
  playInBackground?: boolean;
  playWhenInactive?: boolean; // iOS
  poster?: string | ReactVideoPoster; // string is deprecated
  /** @deprecated use **resizeMode** key in **poster** props instead */
  posterResizeMode?: EnumValues<PosterResizeModeType>;
  preferredForwardBufferDuration?: number; // iOS
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  progressUpdateInterval?: number;
  rate?: number;
  renderLoader?: ReactNode | ((arg0: ReactVideoRenderLoaderProps) => ReactNode);
  repeat?: boolean;
  reportBandwidth?: boolean; //Android
  resizeMode?: EnumValues<VideoResizeMode>;
  showNotificationControls?: boolean; // Android, iOS
  selectedAudioTrack?: SelectedTrack;
  selectedTextTrack?: SelectedTrack;
  selectedVideoTrack?: SelectedVideoTrack; // android
  subtitleStyle?: SubtitleStyle; // android
  shutterColor?: string; // Android
  /** @deprecated Use source.textTracks */
  textTracks?: TextTracks;
  testID?: string;
  viewType?: ViewType;
  /** @deprecated Use viewType */
  useTextureView?: boolean; // Android
  /** @deprecated Use viewType*/
  useSecureView?: boolean; // Android
  volume?: number;
  /** @deprecated use **localSourceEncryptionKeyScheme** key in **drm** props instead */
  localSourceEncryptionKeyScheme?: string;
  debug?: DebugConfig;
  allowsExternalPlayback?: boolean; // iOS
  controlsStyles?: ControlsStyles; // Android
  disableAudioSessionManagement?: boolean; // iOS
}
