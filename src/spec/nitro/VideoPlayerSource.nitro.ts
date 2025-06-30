import type { HybridObject } from 'react-native-nitro-modules';

export interface VideoPlayerSource
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  uri: string;
}

export interface VideoPlayerSourceFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  fromUri(uri: string): VideoPlayerSource;
}
