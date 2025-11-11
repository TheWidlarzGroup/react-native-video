import type { VideoPlayerSource } from '../../spec/nitro/VideoPlayerSource.nitro';
import type { TextTrack } from './TextTrack';
import type { VideoRuntimeError } from './VideoError';
import type { VideoOrientation } from './VideoOrientation';
import type { VideoPlayerStatus } from './VideoPlayerStatus';

export interface VideoPlayerEvents {
  /**
   * Called when the audio becomes noisy.
   * @platform Android
   */
  onAudioBecomingNoisy: () => void;
  /**
   * Called when the audio focus changes.
   * @param hasAudioFocus Whether the audio has focus.
   * @platform Android
   */
  onAudioFocusChange: (hasAudioFocus: boolean) => void;
  /**
   * Called when the bandwidth of the video changes.
   */
  onBandwidthUpdate: (data: BandwidthData) => void;
  /**
   * Called when the video is buffering.
   * @param buffering Whether the video is buffering.
   */
  onBuffer: (buffering: boolean) => void;
  /**
   * Called when the video view's controls visibility changes.
   * @param visible Whether the video view's controls are visible.
   */
  onControlsVisibleChange: (visible: boolean) => void;
  /**
   * Called when the video ends.
   */
  onEnd: () => void;
  /**
   * Called when the external playback state changes.
   * @param externalPlaybackActive Whether the external playback is active.
   * @platform iOS
   */
  onExternalPlaybackChange: (externalPlaybackActive: boolean) => void;
  /**
   * Called when the video is loaded.
   * @note onLoadStart -> initialize the player -> onLoad
   */
  onLoad: (data: onLoadData) => void;
  /**
   * Called when the video starts loading.
   * @note onLoadStart -> initialize the player -> onLoad
   */
  onLoadStart: (data: onLoadStartData) => void;
  /**
   * Called when the player playback state changes.
   */
  onPlaybackStateChange: (data: onPlaybackStateChangeData) => void;
  /**
   * Called when the player playback rate changes.
   */
  onPlaybackRateChange: (rate: number) => void;
  /**
   * Called when the player progress changes.
   */
  onProgress: (data: onProgressData) => void;
  /**
   * Called when the video is ready to display.
   */
  onReadyToDisplay: () => void;
  /**
   * Called when the player seeks.
   */
  onSeek: (seekTime: number) => void;
  /**
   * Called when player receives timed metadata.
   */
  onTimedMetadata: (metadata: TimedMetadata) => void;
  /**
   * Called when the text track (currently displayed subtitle) data changes.
   */
  onTextTrackDataChanged: (texts: string[]) => void;
  /**
   * Called when the selected text track changes.
   * @param track - The newly selected text track, or null if no track is selected
   */
  onTrackChange: (track: TextTrack | null) => void;
  /**
   * Called when the volume of the player changes.
   */
  onVolumeChange: (data: onVolumeChangeData) => void;
  /**
   * Called when the player status changes.
   */
  onStatusChange: (status: VideoPlayerStatus) => void;
}

export interface AllPlayerEvents extends VideoPlayerEvents {
  onError: (error: VideoRuntimeError) => void;
}

export interface VideoViewEvents {
  /**
   * Called when the video view's picture in picture state changes.
   * @param isInPictureInPicture Whether the video view is in picture in picture mode.
   */
  onPictureInPictureChange: (isInPictureInPicture: boolean) => void;
  /**
   * Called when the video view's fullscreen state changes.
   * @param fullscreen Whether the video view is in fullscreen mode.
   */
  onFullscreenChange: (fullscreen: boolean) => void;
  /**
   * Called when the video view will enter fullscreen mode.
   */
  willEnterFullscreen: () => void;
  /**
   * Called when the video view will exit fullscreen mode.
   */
  willExitFullscreen: () => void;
  /**
   * Called when the video view will enter picture in picture mode.
   */
  willEnterPictureInPicture: () => void;
  /**
   * Called when the video view will exit picture in picture mode.
   */
  willExitPictureInPicture: () => void;
}

export interface BandwidthData {
  /**
   * The bitrate of the video in bits per second.
   */
  bitrate: number;
  /**
   * The width of the video in pixels.
   * @platform android
   */
  width?: number;
  /**
   * The height of the video in pixels.
   * @platform Android
   */
  height?: number;
}

export interface onLoadData {
  /**
   * The current time of the video in seconds.
   */
  currentTime: number;
  /**
   * The duration of the video in seconds.
   * @note NaN if the duration is unknown.
   */
  duration: number;
  /**
   * The height of the video in pixels.
   */
  height: number;
  /**
   * The width of the video in pixels.
   */
  width: number;
  /**
   * The orientation of the video.
   */
  orientation: VideoOrientation;
}

export type SourceType = 'local' | 'network';

export interface onLoadStartData {
  /**
   * The type of the source.
   * @note `local` for local files, `network` for network sources.
   */
  sourceType: SourceType;
  /**
   * The source of the video.
   */
  source: VideoPlayerSource;
}

export interface onPlaybackStateChangeData {
  /**
   * Whether the video is playing.
   */
  isPlaying: boolean;
  /**
   * Whether the video is buffering.
   */
  isBuffering: boolean;
}

export interface onProgressData {
  /**
   * The current time of the video in seconds.
   */
  currentTime: number;
  /**
   * The time that player is able to play with only buffer.
   */
  bufferDuration: number;
}

export type TimedMetadataObject = {
  value: string;
  identifier: string;
};

export interface TimedMetadata {
  /**
   * The timed metadata of the video.
   */
  metadata: Array<TimedMetadataObject>;
}

export interface onVolumeChangeData {
  /**
   * The volume of the player (0.0 = 0%, 1.0 = 100%).
   */
  volume: number;
  /**
   * Whether the player is muted.
   */
  muted: boolean;
}

type CheckAllAndOnly<T, A extends readonly (keyof T)[]> =
  // Missing keys?
  Exclude<keyof T, A[number]> extends never
    ? // Extra keys?
      Exclude<A[number], keyof T> extends never
      ? A
      : ['Extra keys', Exclude<A[number], keyof T>]
    : ['Missing keys', Exclude<keyof T, A[number]>];

function allKeysOf<T>() {
  return <A extends readonly (keyof T)[]>(...arr: A): CheckAllAndOnly<T, A> => {
    return arr as CheckAllAndOnly<T, A>;
  };
}

export const ALL_PLAYER_EVENTS: (keyof AllPlayerEvents)[] =
  allKeysOf<AllPlayerEvents>()(
    'onAudioBecomingNoisy',
    'onAudioFocusChange',
    'onBandwidthUpdate',
    'onBuffer',
    'onControlsVisibleChange',
    'onEnd',
    'onError',
    'onExternalPlaybackChange',
    'onLoad',
    'onLoadStart',
    'onPlaybackStateChange',
    'onPlaybackRateChange',
    'onProgress',
    'onReadyToDisplay',
    'onSeek',
    'onTimedMetadata',
    'onTextTrackDataChanged',
    'onTrackChange',
    'onVolumeChange',
    'onStatusChange'
  );
