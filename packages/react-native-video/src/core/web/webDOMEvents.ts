import type { TextTrack } from '../types/TextTrack';
import { type WebError, VideoError } from '../types/VideoError';
import type { WebMediaProxy } from './WebMediaProxy';

type Emit = (event: string, ...args: any[]) => void;
type Cleanup = () => void;

function on(target: EventTarget, event: string, handler: () => void): Cleanup {
  target.addEventListener(event, handler);
  return () => target.removeEventListener(event, handler);
}

// --- Playback: play/pause, buffering, progress, end, rate, seek ---

export function attachPlaybackListeners(
  video: HTMLVideoElement,
  media: WebMediaProxy,
  emit: Emit
): Cleanup[] {
  // Read directly from video element — store may not have synced yet
  // when the DOM event fires, causing a stale (previous) value.
  const isBuffering = () => video.readyState < video.HAVE_FUTURE_DATA;

  return [
    on(video, 'play', () => {
      emit('onPlaybackStateChange', {
        isPlaying: !video.paused,
        isBuffering: isBuffering(),
      });
    }),
    on(video, 'pause', () => {
      emit('onPlaybackStateChange', {
        isPlaying: !video.paused,
        isBuffering: isBuffering(),
      });
    }),
    on(video, 'waiting', () => {
      emit('onBuffer', true);
      emit('onStatusChange', 'loading');
    }),
    on(video, 'canplay', () => {
      emit('onBuffer', false);
      emit('onStatusChange', 'readyToPlay');
    }),
    on(video, 'timeupdate', () => {
      emit('onProgress', {
        currentTime: video.currentTime,
        bufferDuration: media.bufferAhead,
      });
    }),
    on(video, 'ended', () => {
      emit('onEnd');
      emit('onStatusChange', 'idle');
    }),
    // Read directly from video element — store may not have synced yet
    // when the DOM event fires, causing a stale (previous) value.
    on(video, 'ratechange', () => {
      emit('onPlaybackRateChange', video.playbackRate);
    }),
    on(video, 'seeked', () => {
      emit('onSeek', video.currentTime);
    }),
  ];
}

// --- Media info: load, loadstart, ready, volume, error ---

export function attachMediaInfoListeners(
  video: HTMLVideoElement,
  media: WebMediaProxy,
  emit: Emit
): Cleanup[] {
  return [
    on(video, 'durationchange', () => {
      if (video.duration > 0) {
        emit('onLoad', {
          currentTime: video.currentTime,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          orientation: 'unknown',
        });
      }
    }),
    on(video, 'loadstart', () => {
      emit('onLoadStart', {
        sourceType: 'network',
        source: {
          uri: video.currentSrc || video.src,
          config: {
            uri: video.currentSrc || video.src,
            externalSubtitles: [],
          },
          getAssetInformationAsync: async () => ({
            duration: media.duration || NaN,
            width: video.videoWidth,
            height: video.videoHeight,
            orientation: 'unknown',
            bitrate: NaN,
            fileSize: -1n,
            isHDR: false,
            isLive: false,
          }),
        },
      });
    }),
    on(video, 'loadeddata', () => {
      emit('onReadyToDisplay');
    }),
    // Read directly from video element — store may not have synced yet
    // when the DOM event fires, causing a stale (previous) value.
    on(video, 'volumechange', () => {
      emit('onVolumeChange', {
        volume: video.volume,
        muted: video.muted,
      });
    }),
    on(video, 'error', () => {
      emit('onStatusChange', 'error');
      const err = video.error;
      if (!err) {
        console.error('Unknown error occurred in player');
        return;
      }
      const codeMap: Record<number, WebError> = {
        1: 'web/aborted',
        2: 'web/network',
        3: 'web/decode',
        4: 'web/unsupported-source',
      };
      emit(
        'onError',
        new VideoError(codeMap[err.code] ?? 'unknown/unknown', err.message)
      );
    }),
  ];
}

// --- Text tracks: selection, cue changes, timed metadata ---

export function attachTrackListeners(
  video: HTMLVideoElement,
  emit: Emit
): Cleanup[] {
  const cleanups: Cleanup[] = [];
  const textTracks = video.textTracks;

  const onTrackChange = () => {
    let selected: TextTrack | null = null;
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i]!;
      if (t.mode === 'showing') {
        selected = {
          id: t.id || t.label,
          label: t.label,
          language: t.language,
          selected: true,
        };
        break;
      }
    }
    emit('onTrackChange', selected);
  };
  textTracks.addEventListener('change', onTrackChange);
  cleanups.push(() => textTracks.removeEventListener('change', onTrackChange));

  const cueChangeHandlers = new Map<globalThis.TextTrack, () => void>();

  const attachCueListeners = () => {
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i]!;
      if (cueChangeHandlers.has(track)) continue;

      const handler = () => {
        const cues = track.activeCues;
        if (!cues) return;

        if (track.kind === 'metadata') {
          const metadata = [];
          for (let j = 0; j < cues.length; j++) {
            const cue = cues[j] as VTTCue;
            metadata.push({
              value: cue.text ?? '',
              identifier: cue.id ?? '',
            });
          }
          if (metadata.length > 0) {
            emit('onTimedMetadata', { metadata });
          }
        } else {
          const texts = [];
          for (let j = 0; j < cues.length; j++) {
            texts.push((cues[j] as VTTCue).text ?? '');
          }
          emit('onTextTrackDataChanged', texts);
        }
      };

      track.addEventListener('cuechange', handler);
      cueChangeHandlers.set(track, handler);
    }
  };

  attachCueListeners();
  textTracks.addEventListener('addtrack', attachCueListeners);
  cleanups.push(() => {
    textTracks.removeEventListener('addtrack', attachCueListeners);
    for (const [track, handler] of cueChangeHandlers) {
      track.removeEventListener('cuechange', handler);
    }
    cueChangeHandlers.clear();
  });

  return cleanups;
}
