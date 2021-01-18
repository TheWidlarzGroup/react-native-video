export interface IVideoPlayerIMA {
  adTagParameters?: Record<string, string>;
  assetKey?: string;
  authToken?: string;
  contentSourceId?: string;
  endDate?: number;
  startDate?: number;
  videoId?: string;
}

export interface IVideoReplaceAdTagParametersPayload {
  adTagParameters: Record<string, string>;
  endDate: number;
  startDate: number;
}

export interface IVideoPlayerOnRequireAdParametersPayload {
  date: number;
}
