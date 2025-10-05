import {logger} from './logger';

// Video Player Event Logging
export const videoLogger = {
  // Playback Events
  onLoad: (data: any) => {
    logger.videoEvent('onLoad', {
      duration: data.duration,
      naturalSize: data.naturalSize,
      canPlayFastForward: data.canPlayFastForward,
      canPlayReverse: data.canPlayReverse,
      canStepForward: data.canStepForward,
      canStepBackward: data.canStepBackward,
    });
  },

  onLoadStart: (data: any) => {
    logger.videoEvent('onLoadStart', {
      isNetwork: data.isNetwork,
      type: data.type,
      uri: data.uri,
    });
  },

  onProgress: (data: any) => {
    logger.videoEvent('onProgress', {
      currentTime: data.currentTime,
      playableDuration: data.playableDuration,
      seekableDuration: data.seekableDuration,
    });
  },

  onBuffer: (data: any) => {
    logger.videoEvent('onBuffer', {isBuffering: data.isBuffering});
  },

  onError: (error: any) => {
    logger.error('Video Error:', {
      errorString: error.errorString,
      errorException: error.errorException,
      errorStackTrace: error.errorStackTrace,
      errorCode: error.errorCode,
    });
  },

  // DataZoom Integration Events
  onDataZoomInit: (config: any) => {
    logger.datazoom('initialize', {
      config,
      timestamp: new Date().toISOString(),
    });
  },

  onDataZoomEvent: (eventType: string, data: any) => {
    logger.datazoom(`event_${eventType}`, {
      data,
      timestamp: new Date().toISOString(),
    });
  },

  // Quality and Performance
  onBandwidthUpdate: (data: any) => {
    logger.videoEvent('onBandwidthUpdate', {
      bitrate: data.bitrate,
      width: data.width,
      height: data.height,
    });
  },

  onPlaybackRateChange: (data: any) => {
    logger.videoEvent('onPlaybackRateChange', {
      playbackRate: data.playbackRate,
    });
  },

  // Custom Debug Events
  debugVideoState: (state: any) => {
    logger.debug('Video State:', {
      paused: state.paused,
      currentTime: state.currentTime,
      duration: state.duration,
      rate: state.rate,
      volume: state.volume,
      muted: state.muted,
    });
  },
};

export default videoLogger;
