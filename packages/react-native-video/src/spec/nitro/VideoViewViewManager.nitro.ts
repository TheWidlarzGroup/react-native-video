import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayer } from './VideoPlayer.nitro';

// @internal
export interface VideoViewViewManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  player?: VideoPlayer;
  controls: boolean;
  pictureInPicture: boolean;
  autoEnterPictureInPicture: boolean;
  enterFullscreen(): void;
  exitFullscreen(): void;
  enterPictureInPicture(): void;
  exitPictureInPicture(): void;
  canEnterPictureInPicture(): boolean;
}

// @internal
export interface VideoViewViewManagerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createViewManager(nitroId: number): VideoViewViewManager;
}
