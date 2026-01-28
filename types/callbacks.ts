import { IVideoPlayerMediaTrackChangedEvent, IVideoPlayerPlayPauseEvent, IVideoPlayerSeekEndedEvent } from "./event";
import { IVideoPlayerOnRequireAdParametersPayload } from "./ima";
import { IVideoPlayerPreferredSmartSubtitlesChangedPayload } from "./source";

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
  onSeekEndedEvent?: (e: IVideoPlayerSeekEndedEvent) => void;
  onStatsIconClick?: () => void;
  onTimedMetadata?: (e: any) => void;
  onVideoAboutToEnd?: (e: any) => void;
  onWatchlistButtonClick?: (e: any) => void;
  onReloadCurrentSource?: (e: any) => void;
  onBehindLiveWindowError?: (e: any) => void;
  onAudioTrackChanged?: (e: IVideoPlayerMediaTrackChangedEvent) => void;
  onSubtitleTrackChanged?: (e: IVideoPlayerMediaTrackChangedEvent) => void;
  onSkipMarkerButton?: (e: any) => void;
  onPlayPauseAction?: (e: IVideoPlayerPlayPauseEvent) => void;
  onPreferredSmartSubtitlesChanged?: (e: IVideoPlayerPreferredSmartSubtitlesChangedPayload) => void;
}
