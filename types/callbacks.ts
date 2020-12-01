export interface IVideoPlayerCallbacks {
  onBuffer?: (e: any) => void;
  onEnd?: (e: any) => void;
  onEpgIconClick?: (e: any) => void;
  onError?: (e: any) => void;
  onLoad?: (e: any) => void;
  onLoadStart?: (e: any) => void;
  onPlaybackRateChange?: ({ playbackRate: number }) => void;
  onProgress?: (e: any) => void;
  onReadyForDisplay?: (e: any) => void;
  onSeek?: (e: any) => void;
  onStatsIconClick?: () => void;
  onTimedMetadata?: (e: any) => void;
  onPlaybackStalled?: (e: any) => void;
  onPlaybackResume?: (e: any) => void;
  onRelatedVideoClicked?: (e: any) => void;
  onVideoAboutToEnd?: (e: any) => void;
}
