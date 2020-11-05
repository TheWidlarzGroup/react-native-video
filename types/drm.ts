export interface IVideoPlayerDRM {
  id: number;
  contentUrl: string;
  drmScheme: string;
  licensingServerUrl: string;
  croToken: string;
}
