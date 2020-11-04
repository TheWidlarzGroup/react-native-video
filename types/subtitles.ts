export interface IVideoPlayerSubtitles {
  language: string;
  type: TextTrackType;
  uri: string;
}

export enum TextTrackType {
  SRT = 'application/x-subrip',
  TTML = 'application/ttml+xml',
  VTT = 'text/vtt',
};
