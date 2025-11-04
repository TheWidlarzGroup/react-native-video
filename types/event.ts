
export enum IVideoPlayerSeekType {
  SKIP = "skip",
  SEEK = "seek",
  GO_LIVE = "liveBadge",
  SKIP_MARKER = "skipMarker",
}

export interface IVideoPlayerSeekEndedEvent {
  seekType: IVideoPlayerSeekType;
  seekStartAt: number;
  seekEndAt: number;
};

export interface IVideoPlayerPlayPauseEvent {
  isPaused: boolean;
};
