import { IVideoPlayerDRM } from './drm';
import { IVideoPlayerIMA } from './ima';
import { IMuxData } from './mux';
import { IVideoPlayerSubtitles } from './subtitles';
import { IVideoPlayerAPS } from './aps';
import { INowPlaying } from "./nowPlaying";

type SourceType = 'mpd' | 'm3u8';

export interface IVideoPlayerSourceMetadata {
  logoUrl?: string;
  logoPosition?: string;
  logoStaticDimension?: string;
  logoPlayerSizeRatio?: number;
}

export interface IVideoPlayerSourceLimitedSeekableRange {
  start?: number;
  end?: number;
  seekToStart?: boolean;
}

export interface IVideoPlayerSource {
  uri: string;
  id?: string;
  subtitles?: IVideoPlayerSubtitles[];
  type?: SourceType;
  duration?: string;
  drm?: IVideoPlayerDRM;
  ima?: IVideoPlayerIMA;
  config?: {
    muxData: IMuxData;
  };
  limitedSeekableRange?: IVideoPlayerSourceLimitedSeekableRange;
  mainVer?: number;
  patchVer?: number;
  requestHeaders?: Record<string, any>;
  aps?: IVideoPlayerAPS;
  channelId?: string;
  seriesId?: string;
  seasonId?: string;
  playlistId?: string;
  channelName?: string;
  adTagUrl?: string;
  metadata?: IVideoPlayerSourceMetadata;
  shouldSaveSubtitleSelection?: boolean;
  nowPlaying: INowPlaying;
  thumbnailsPreview?: string;
}
