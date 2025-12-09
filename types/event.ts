
export enum IVideoPlayerSeekType {
  SKIP = "skip",
  SEEK = "seek",
  GO_LIVE = "liveBadge",
  SKIP_MARKER = "skipMarker",
}

export enum IVideoPlayerMediaTrackAction {
  UI = "ui",
  PLAYER = "player",
}

export interface IVideoPlayerSeekEndedEvent {
  seekType: IVideoPlayerSeekType;
  seekStartAt: number;
  seekEndAt: number;
};

export interface IVideoPlayerPlayPauseEvent {
  isPaused: boolean;
};

export interface IVideoPlayerMediaTrackChangedEvent {
  language: string;
  action: IVideoPlayerMediaTrackAction;
}
