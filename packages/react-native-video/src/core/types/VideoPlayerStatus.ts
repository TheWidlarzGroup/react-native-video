/**
 * The status of the player.
 * @param idle - The player is idle (source is not loaded)
 * @param loading - The player is loading (source is loading).
 * @param readyToPlay - The player is ready to play (source is loaded). It stays `readyToPlay` after the video has played to the end.
 * @param error - The player has an error (source is not loaded). It stays `error` until a source is loaded again.
 */
export type VideoPlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';
