import type { VideoPlayerSourceBase } from '../types/VideoPlayerSourceBase';
import { VideoRuntimeError } from '../types/VideoError';
import { HAVE_FUTURE_DATA, type KeplerMedia } from './KeplerMedia';

type Emit = (event: string, ...args: any[]) => void;
type Cleanup = () => void;

const MEDIA_ERRORS: Record<number, string> = {
  1: 'aborted',
  2: 'network',
  3: 'decode',
  4: 'source not supported',
};

/**
 * w3cmedia events to react-native-video events, like `webDOMEvents.ts` does for the web.
 * Where w3cmedia differs from an HTML `<video>`:
 * - `loadstart` comes twice per source (at `src` and again after the metadata): sent once;
 * - `durationchange` comes before `loadedmetadata`, when the size is still 0x0: `onLoad` waits
 *   for the metadata;
 * - `seeked` carries the time from before the seek: `onSeek` sends the seek target;
 * - after `ended` there is no `pause` and `paused` stays false: the end is sent as a pause.
 */
export function attachKeplerMediaEvents(
  media: KeplerMedia,
  getSource: () => VideoPlayerSourceBase,
  emit: Emit
): Cleanup[] {
  const video = media.video;
  // After the end w3cmedia keeps readyState at 2, which is not buffering.
  const isBuffering = () =>
    !media.isEnded && media.readyState < HAVE_FUTURE_DATA;
  const playbackState = () => ({
    isPlaying: !media.paused,
    isBuffering: isBuffering(),
  });
  let loadStartSent = -1;
  let loadedDuration = NaN;
  let loadedSource = -1;

  const sendLoad = () => {
    const duration = media.duration;
    if (!(duration > 0) || media.readyState < 1) return;
    if (loadedSource === media.sourceId && loadedDuration === duration) return;
    loadedSource = media.sourceId;
    loadedDuration = duration;
    emit('onLoad', {
      currentTime: media.currentTime,
      duration,
      width: media.width,
      height: media.height,
      orientation: 'unknown',
    });
  };

  const on = (event: string, handler: () => void): Cleanup => {
    video.addEventListener(event, handler);
    return () => video.removeEventListener(event, handler);
  };

  return [
    on('loadstart', () => {
      if (loadStartSent === media.sourceId) return;
      loadStartSent = media.sourceId;
      emit('onLoadStart', { sourceType: 'network', source: getSource() });
    }),
    on('loadedmetadata', sendLoad),
    on('durationchange', sendLoad),
    on('loadeddata', () => emit('onReadyToDisplay')),
    on('play', () => emit('onPlaybackStateChange', playbackState())),
    on('pause', () => emit('onPlaybackStateChange', playbackState())),
    on('waiting', () => {
      emit('onBuffer', true);
      emit('onStatusChange', 'loading');
    }),
    on('canplay', () => {
      emit('onBuffer', false);
      emit('onStatusChange', 'readyToPlay');
    }),
    on('timeupdate', () => {
      emit('onProgress', {
        currentTime: media.currentTime,
        bufferDuration: media.bufferAhead,
      });
    }),
    on('seeked', () => emit('onSeek', media.takeSeekTarget())),
    on('ended', () => {
      emit('onPlaybackStateChange', playbackState());
      emit('onEnd');
      emit('onStatusChange', 'idle');
    }),
    on('ratechange', () => emit('onPlaybackRateChange', media.rate)),
    on('volumechange', () => {
      emit('onVolumeChange', { volume: media.volume, muted: media.muted });
    }),
    on('error', () => {
      emit('onStatusChange', 'error');
      const error = media.error;
      const reason = error
        ? `MediaError ${error.code} (${MEDIA_ERRORS[error.code] ?? 'unknown'})${
            error.message ? `: ${error.message}` : ''
          }`
        : 'unknown media error';
      emit('onError', new VideoRuntimeError('player/playback-failed', reason));
    }),
  ];
}
