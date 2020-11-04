import { IVideoPlayerIMA } from "../types/ima";

export const isIMAStream = (url: string): boolean => {
  return url.startsWith('https://dai.google.com');
}

export const getIMAConfig = (url: string): IVideoPlayerIMA => {
  const isVod = url.indexOf('https://dai.google.com/ondemand') !== -1;
  const regex = isVod ? /content\/([^\/]+)\/vid\/([^\/]+)\/master\.m3u8\?auth-token=([^\/]+)/ : /event\/([^\/]+)/;

  const config: IVideoPlayerIMA = {};
  
  const matches = url.match(regex);

  if (matches) {
    if (isVod && matches[1] && matches[2] && matches[3]) {
      config.contentSourceId = matches[1];
      config.videoId = matches[2];
      config.authToken = matches[3].replace(/%3D/g, '=').replace(/%7E/g, '~');
    } else if (!isVod && matches[1]) {
      config.assetKey = matches[1];
    }
  }

  return config;
}
