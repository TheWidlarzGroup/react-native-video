import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayer } from './VideoPlayer.nitro';

export interface VideoViewViewManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  player?: VideoPlayer;
}

export interface VideoViewViewManagerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createViewManager(nitroId: number): VideoViewViewManager;
}
