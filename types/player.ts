import { ViewProps } from 'react-native';

import { IVideoPlayerButtons } from './buttons';
import { IVideoPlayerCallbacks } from './callbacks';
import { VideoResizeMode } from './resizeMode';
import { IVideoPlayerSource } from './source';
import { IVideoPlayerTranslations } from './translations';
import { IVideoPlayerTheme } from './theme';
import { IVideoBufferConfig } from './buffer';

export interface IVideoPlayer extends IVideoPlayerCallbacks, ViewProps {
  audioOnly?: boolean;
  bufferConfig?: IVideoBufferConfig;
  buttons?: IVideoPlayerButtons;
  colorProgressBar?: string
  controls?: boolean;
  disableFocus?: boolean;
  hasEpg?: boolean;
  hasStats?: boolean;
  height?: number;
  isFavourite?: boolean;
  labelFontName?: string;
  locale?: string;
  live?: boolean;
  mediaKeys?: boolean;
  muted?: boolean;
  overlayAutoHideTimeout?: number;
  poster?: string;
  paused?: boolean;
  playInBackground?: boolean;
  source: IVideoPlayerSource;
  resizeMode: VideoResizeMode;
  repeat?: boolean;
  theme?: IVideoPlayerTheme;
  translations?: IVideoPlayerTranslations;
  stateMiddleCoreControls?: string;
  selectedAudioTrack?: any // TODO
  width?: number;
}
