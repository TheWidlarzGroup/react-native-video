import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayerSource } from './VideoPlayerSource.nitro';

export interface VideoPlayer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The source of the video.
   * Changing the source will reload player.
   * see {@link VideoPlayerSource}
   */
  readonly source: VideoPlayerSource;

  /**
   * The current time of the video in seconds (1.0 = 1 sec).
   * Returns NaN if the current time is not available.
   */
  readonly duration: number;

  /**
   * The volume of the video (0.0 = 0%, 1.0 = 100%).
   */
  volume: number;

  /**
   * The duration of the video in seconds (1.0 = 1 sec).
   * Returns NaN if the duration is not available.
   */
  currentTime: number;

  /**
   * Preload the video.
   * This is useful to avoid delay when the user plays the video.
   * Preloading too many videos can lead to memory issues or performance issues.
   */
  preload(): Promise<void>;

  /**
   * Start playback of player.
   */
  play(): void;

  /**
   * Pause playback of player.
   */
  pause(): void;

  /**
   * Replace the current source of the player.
   * @param source - The new source of the video.
   * see {@link VideoPlayerSource}
   */
  replaceSourceAsync(source: VideoPlayerSource): Promise<void>;
}

export interface VideoPlayerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createPlayer(source: VideoPlayerSource): VideoPlayer;
}
