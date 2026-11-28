import type { VideoPlayerBase } from './VideoPlayerBase';

/**
 * The VideoPlayer type on web.
 * Audio and video track selection are on {@link VideoPlayerBase} - they are
 * native/web shared APIs, not web-only - so this type only adds access to the
 * `<video>` element.
 *
 * @experimental Audio/video tracks have ~16% browser support (Safari only, behind flags in Chrome/Firefox).
 * The track methods return empty arrays on unsupported browsers.
 *
 * @example
 * ```ts
 * import { useVideoPlayer, type WebVideoPlayer } from 'react-native-video';
 *
 * const player = useVideoPlayer(source) as WebVideoPlayer;
 * const audioTracks = player.getAvailableAudioTracks();
 * const videoTracks = player.getAvailableVideoTracks();
 * ```
 */
export type WebVideoPlayer = VideoPlayerBase & {
  /**
   * The underlying `<video>` element (v6 `nativeHtmlVideoRef.current`).
   * Use it for browser APIs the player does not wrap. Changing playback
   * state through it bypasses the player, so prefer the player's own API
   * where one exists.
   */
  readonly nativeHtmlVideoElement: HTMLVideoElement;
};
