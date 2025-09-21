import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoViewEvents } from '../../core/types/Events';
import type { ResizeMode } from '../../core/types/ResizeMode';
import type { VideoPlayer } from './VideoPlayer.nitro';

// @internal
export interface VideoViewViewManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>,
    Partial<VideoViewEvents> {
  player?: VideoPlayer;
  controls: boolean;
  pictureInPicture: boolean;
  autoEnterPictureInPicture: boolean;
  resizeMode: ResizeMode;
  enterFullscreen(): void;
  exitFullscreen(): void;
  enterPictureInPicture(): void;
  exitPictureInPicture(): void;
  canEnterPictureInPicture(): boolean;
  keepScreenAwake: boolean;
}

// @internal
export interface VideoViewViewManagerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createViewManager(nitroId: number): VideoViewViewManager;
}
