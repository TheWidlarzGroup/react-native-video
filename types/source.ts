import { IVideoPlayerDRM } from './drm';
import { IVideoPlayerIMA } from './ima';
import { IVideoPlayerMetadata } from './metadata';
import { IMuxData } from './mux';
import { IVideoPlayerSubtitles } from './subtitles';
import { IVideoPlayerAPS } from './aps';

type SourceType = 'mpd' | 'm3u8';

export interface IVideoPlayerSource {
  uri: string;
  subtitles?: IVideoPlayerSubtitles[],
  type?: SourceType;
  drm?: IVideoPlayerDRM;
  ima?: IVideoPlayerIMA;
  metadata?: IVideoPlayerMetadata;
  config?: {
    muxData: IMuxData
  },
  mainVer?: number;
  patchVer?: number;
  requestHeaders?: Record<string, any>;
  aps?: IVideoPlayerAPS;
}
