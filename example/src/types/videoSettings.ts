import type {
  AudioOutput,
  ControlsStyles,
  FullscreenOrientation,
  IgnoreSilentSwitchMode,
  MixAudioMode,
  ResizeMode,
  VideoConfig,
  VideoPosterResizeMode,
  VideoViewProps,
} from 'react-native-video';

export type BufferingStrategy = NonNullable<
  NonNullable<VideoConfig['bufferConfig']>['bufferingStrategy']
>;
export type SurfaceType = NonNullable<VideoViewProps['surfaceType']>;
export type CmcdChoice = 'off' | 'query' | 'header';

/**
 * Options of the source. They apply when a source is loaded: press "Apply source options"
 * or pick a video type.
 */
export interface SourceOptions {
  // Sources with externalSubtitles are not cached, so turn this off to try shouldCache.
  externalSubtitles: boolean;
  shouldCache: boolean;
  // Milliseconds, as in v6. null leaves the option out.
  startPosition: number | null;
  cropStart: number | null;
  cropEnd: number | null;
  minLoadRetryCount: number | null;
  disableDisconnectError: boolean;
  // Forces the stream type, for a URL without an extension. null: from the URL.
  type: string | null;
  cmcd: CmcdChoice;
  bufferingStrategy: BufferingStrategy;
}

export interface VideoSettings {
  show: boolean;
  videoType: 'hls' | 'mp4' | 'drm';
  volume: number;
  muted: boolean;
  rate: number;
  loop: boolean;
  showNativeControls: boolean;
  resizeMode: ResizeMode;
  mixAudioMode: MixAudioMode;
  ignoreSilentSwitchMode: IgnoreSilentSwitchMode;
  playInBackground: boolean;
  playWhenInactive: boolean;
  showNotificationControls: boolean;
  audioOutput: AudioOutput;
  allowsExternalPlayback: boolean;
  // Milliseconds between onProgress events. null: the platform default.
  progressUpdateInterval: number | null;
  fullscreenOrientation: FullscreenOrientation;
  fullscreenAutorotate: boolean;
  surfaceType: SurfaceType;
  controlsStyles: ControlsStyles;
  poster: boolean;
  posterResizeMode: VideoPosterResizeMode;
  renderLoader: boolean;
  // null leaves shutterColor out.
  shutterColor: string | null;
  hideShutterView: boolean;
  source: SourceOptions;
}

export const defaultSourceOptions: SourceOptions = {
  externalSubtitles: true,
  shouldCache: false,
  startPosition: null,
  cropStart: null,
  cropEnd: null,
  minLoadRetryCount: null,
  disableDisconnectError: false,
  type: null,
  cmcd: 'off',
  bufferingStrategy: 'default',
};

export const defaultSettings: VideoSettings = {
  show: false,
  videoType: 'hls',
  volume: 1,
  muted: false,
  rate: 1,
  loop: false,
  showNativeControls: false,
  resizeMode: 'contain',
  mixAudioMode: 'auto',
  ignoreSilentSwitchMode: 'auto',
  playInBackground: true,
  playWhenInactive: false,
  showNotificationControls: true,
  audioOutput: 'speaker',
  allowsExternalPlayback: true,
  progressUpdateInterval: null,
  fullscreenOrientation: 'all',
  fullscreenAutorotate: true,
  surfaceType: 'surface',
  controlsStyles: {},
  poster: false,
  posterResizeMode: 'cover',
  renderLoader: false,
  shutterColor: null,
  hideShutterView: false,
  source: defaultSourceOptions,
};
