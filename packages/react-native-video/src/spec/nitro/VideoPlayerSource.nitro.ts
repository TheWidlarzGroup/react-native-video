import type { HybridObject } from 'react-native-nitro-modules';
import type { NativeVideoConfig } from '../../core/types/VideoConfig';
import type { VideoPlayerSourceBase } from '../../core/types/VideoPlayerSourceBase';

/**
 * A source for a {@link VideoPlayer}.
 * Source cannot be changed after it is created. If you need to update the source, you need to create a new one.
 * It provides functions to get information about the asset.
 */
export interface VideoPlayerSource
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>,
    VideoPlayerSourceBase {}

export interface VideoPlayerSourceFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  fromUri(uri: string): VideoPlayerSource;
  fromVideoConfig(config: NativeVideoConfig): VideoPlayerSource;
}
