import { ViewProps } from 'react-native';

import { IVideoPlayerButtons } from './buttons';
import { IVideoPlayerCallbacks } from './callbacks';
import { VideoResizeMode } from './resizeMode';
import { IVideoPlayerSource } from './source';
import { IVideoPlayerTranslations } from './translations';
import { IVideoPlayerTheme } from './theme';

export interface IVideoPlayer extends IVideoPlayerCallbacks, ViewProps {
  audioOnly?: boolean;
  buttons: IVideoPlayerButtons;
  colorProgressBar?: string
  controls: boolean;
  hasEpg: boolean;
  hasStats: boolean;
  isFavourite: boolean;
  labelFontName?: string;
  live: boolean;
  overlayAutoHideTimeout: number,
  playInBackground: boolean;
  source: IVideoPlayerSource;
  resizeMode: VideoResizeMode;
  theme: IVideoPlayerTheme;
  translations: IVideoPlayerTranslations;
  stateMiddleCoreControls: string;
}
