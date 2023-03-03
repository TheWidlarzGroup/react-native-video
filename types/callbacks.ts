import { IVideoPlayerOnRequireAdParametersPayload } from "./ima";

export interface IVideoPlayerCallbacks {
  onAnnotationsButtonClick?: (e: any) => void;
  onBuffer?: (e: any) => void;
  onEnd?: (e: any) => void;
  onEpgIconClick?: (e: any) => void;
  onError?: (e: any) => void;
  onFavouriteButtonClick?: (e: any) => void;
  onLoad?: (e: any) => void;
  onLoadStart?: (e: any) => void;
  onPlaybackRateChange?: ({ playbackRate }: { playbackRate: number }) => void;
  onPlaybackResume?: (e: any) => void;
  onPlaybackStalled?: (e: any) => void;
  onProgress?: (e: any) => void;
  onReadyForDisplay?: (e: any) => void;
  onRelatedVideoClicked?: (e: any) => void;
  onRelatedVideosIconClicked?: (e: any) => void;
  onRequireAdParameters?: (e: IVideoPlayerOnRequireAdParametersPayload) => void;
  onSeek?: (e: any) => void;
  onStatsIconClick?: () => void;
  onTimedMetadata?: (e: any) => void;
  onVideoAboutToEnd?: (e: any) => void;
  onReloadCurrentSource?: (e: any) => void;
  onBehindLiveWindowError?: (e: any) => void;
}
