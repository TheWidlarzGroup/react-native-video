import type { HybridObject } from 'react-native-nitro-modules';
import type { ResizeMode } from '../../core/types/ResizeMode';
import type { VideoPlayer } from './VideoPlayer.nitro';
import type { ListenerSubscription } from './VideoPlayerEventEmitter.nitro';

export type SurfaceType = 'surface' | 'texture';

// @internal
export interface VideoViewViewManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
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
  surfaceType: SurfaceType;

  // Event listeners

  /**
   * Adds a listener for the `onPictureInPictureChange` event.
   * @see {@link VideoViewEvents.onPictureInPictureChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnPictureInPictureChangeListener(
    listener: (isInPictureInPicture: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onFullscreenChange` event.
   * @see {@link VideoViewEvents.onFullscreenChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnFullscreenChangeListener(
    listener: (fullscreen: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `willEnterFullscreen` event.
   * @see {@link VideoViewEvents.willEnterFullscreen}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addWillEnterFullscreenListener(listener: () => void): ListenerSubscription;

  /**
   * Adds a listener for the `willExitFullscreen` event.
   * @see {@link VideoViewEvents.willExitFullscreen}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addWillExitFullscreenListener(listener: () => void): ListenerSubscription;

  /**
   * Adds a listener for the `willEnterPictureInPicture` event.
   * @see {@link VideoViewEvents.willEnterPictureInPicture}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addWillEnterPictureInPictureListener(
    listener: () => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `willExitPictureInPicture` event.
   * @see {@link VideoViewEvents.willExitPictureInPicture}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addWillExitPictureInPictureListener(
    listener: () => void
  ): ListenerSubscription;

  /**
   * Clears all listeners from the event emitter.
   */
  clearAllListeners(): void;
}

// @internal
export interface VideoViewViewManagerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createViewManager(nitroId: number): VideoViewViewManager;
}
