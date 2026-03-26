import type { AudioTrack } from './AudioTrack';
import type { VideoTrack } from './VideoTrack';
import type { VideoPlayerBase } from './VideoPlayerBase';

/**
 * Extended VideoPlayer interface with web-only methods.
 * Use this type when you need access to audio/video track APIs on web.
 *
 * @experimental Audio/video tracks have ~16% browser support (Safari only, behind flags in Chrome/Firefox).
 * These methods return empty arrays on unsupported browsers.
 *
 * @example
 * ```ts
 * import { useVideoPlayer, type WebVideoPlayer } from 'react-native-video';
 *
 * const player = useVideoPlayer(source) as WebVideoPlayer;
 * const audioTracks = player.getAvailableAudioTracks();
 * ```
 */
export interface WebVideoPlayer extends VideoPlayerBase {
  getAvailableAudioTracks(): AudioTrack[];
  selectAudioTrack(track: AudioTrack | null): void;
  readonly selectedAudioTrack?: AudioTrack;

  getAvailableVideoTracks(): VideoTrack[];
  selectVideoTrack(track: VideoTrack | null): void;
  readonly selectedVideoTrack?: VideoTrack;
}
