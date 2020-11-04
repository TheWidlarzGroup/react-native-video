import { ViewProps } from "react-native";

import { IVideoPlayerButtons } from "./buttons";
import { IVideoPlayerCallbacks } from "./callbacks";
import { VideoResizeMode } from "./resizeMode";
import { IVideoPlayerSource } from "./source";

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


