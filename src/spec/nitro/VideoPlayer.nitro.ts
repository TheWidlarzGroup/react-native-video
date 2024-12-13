import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayerSource } from './VideoPlayerSource.nitro';

export interface VideoPlayer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  source: VideoPlayerSource;
  volume: number;
  currentTime: number;
  readonly duration: number;

  play(): void;
  pause(): void;
}

export interface VideoPlayerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createPlayer(source: VideoPlayerSource): VideoPlayer;
}
