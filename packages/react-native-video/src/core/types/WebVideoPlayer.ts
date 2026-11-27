import type { VideoPlayerBase } from './VideoPlayerBase';

/**
 * The VideoPlayer type on web.
 * Audio and video track selection are on {@link VideoPlayerBase} - they are
 * native/web shared APIs, not web-only - so this type adds nothing to it. It
 * is kept so existing `as WebVideoPlayer` casts keep compiling.
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
export type WebVideoPlayer = VideoPlayerBase;
