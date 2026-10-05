import type { VideoTrack } from './VideoTrack';
import type { VideoPlayerBase } from './VideoPlayerBase';

/**
 * Extended VideoPlayer interface with web-only methods.
 * Use this type when you need access to video track APIs on web.
 * (Audio track selection is on {@link VideoPlayerBase} - it's a native/web
 * shared API, not web-only.)
 *
 * @experimental Video tracks have ~16% browser support (Safari only, behind flags in Chrome/Firefox).
 * These methods return empty arrays on unsupported browsers.
 *
 * @example
 * ```ts
 * import { useVideoPlayer, type WebVideoPlayer } from 'react-native-video';
 *
 * const player = useVideoPlayer(source) as WebVideoPlayer;
 * const videoTracks = player.getAvailableVideoTracks();
 * ```
 */
export interface WebVideoPlayer extends VideoPlayerBase {
  getAvailableVideoTracks(): VideoTrack[];
  selectVideoTrack(track: VideoTrack | null): void;
  readonly selectedVideoTrack?: VideoTrack;
}
