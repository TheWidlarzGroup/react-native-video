import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayerBase } from '../../core/types/VideoPlayerBase';
import type { VideoPlayerSource } from './VideoPlayerSource.nitro';

export interface VideoPlayer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>,
    VideoPlayerBase {
  // Override with (hybrid) VideoPlayerSource
  readonly source: VideoPlayerSource;
  replaceSourceAsync(source: VideoPlayerSource): Promise<void>;

  /**
   * Release the player resources.
   * It's shouldn't be called manually. You should use the `dispose` method instead.
   */
  clean(): void;
}

export interface VideoPlayerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createPlayer(source: VideoPlayerSource): VideoPlayer;
}
