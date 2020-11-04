import { string } from "prop-types";
import { ViewProps } from "react-native";
import { VideoResizeMode } from './VideoResizeMode';

export interface IVideoPlayer extends IVideoPlayerCallbacks, ViewProps {
  audioOnly?: boolean;
  buttons: IVideoPlayerButtons;
  colorProgressBar?: string
  controls: boolean;
  hasEpg: boolean;
  hasStats: boolean;
  isFavourites: boolean;
  labelFontName?: string;
  live: boolean;
  overlayAutoHideTimeout: number,
  playInBackground: boolean;
  source: IVideoPlayerSource;
  resizeMode: VideoResizeMode;
  translations: IVideoPlayerTranslations;
  stateMiddleCoreControls: string;
}

interface IVideoPlayerCallbacks {
  onBuffer: (e: any) => void;
  onEnd: (e: any) => void;
  onError: (e: any) => void;
  onLoad: (e: any) => void;
  onLoadStart: (e: any) => void;
  onPlaybackRateChange: ({ playbackRate: number }) => void;
  onProgress: (e: any) => void;
  onReadyForDisplay: (e: any) => void;
  onSeek: (e: any) => void;
  onStatsIconClick: () => void;
  onTimedMetadata: (e: any) => void;
  onPlaybackStalled: (e: any) => void;
  onPlaybackResume: (e: any) => void;
}

interface IVideoPlayerButtons {
  watchlist?: boolean;
  favourite?: boolean;
}

type SourceType = 'mpd' | 'm3u8';

export interface IVideoPlayerSource {
  uri: string;
  subtitles: IVideoPlayerSubtitles[],
  type: SourceType;
  drm: IVideoPlayerDRM;
  ima: IVideoPlayerIMA;
  metadata: IVideoPlayerMetadata;
  config: {
    muxData: IMuxData
  },
  mainVer?: number;
  patchVer?: number;
  requestHeaders?: Record<string, any>
}

interface IMuxData {
  envKey: string;
  subPropertyId: string;
  viewerUserId: string;
  videoId: string;
  videoDuration: number;
  videoIsLive: boolean;
  videoStreamType: string;
  videoTitle: string;
}

interface IVideoPlayerMetadata {
  id: string;
  description: string;
  thumbnailUrl: string;
  title: string;
  type: string;
}

interface IVideoPlayerDRM {
  id: number;
  contentUrl: string;
  drmScheme: string;
  licensingServerUrl: string;
  croToken: string;
}

interface IVideoPlayerSubtitles {
  language: string;
  type: string; // e.g. 'text/vtt'
  uri: string;
}

export interface IVideoPlayerIMA {
  adTagParameters?: Record<string, string>;
  assetKey?: string;
  authToken?: string;
  contentSourceId?: string;
  videoId?: string;
}

interface IVideoPlayerTranslations {
  player_epg_button: string;
  player_stats_button: string;
  player_play_button: string;
  player_pause_button: string;
  player_audio_and_subtitles_button: string;
  // new labels
  favourite: string;
  watchlist: string;
  moreVideos: string;
}



export interface IVideoPlayerTheme {
  colors: IVideoPlayerThemeObject,
  fonts: IVideoPlayerThemeObject
}


interface IVideoPlayerThemeObject {
  primary?: string;
  secondary?: string;
}