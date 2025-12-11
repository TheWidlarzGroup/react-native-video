import type { HybridObject } from 'react-native-nitro-modules';
import type {
  BandwidthData,
  onLoadData,
  onLoadStartData,
  onPlaybackStateChangeData,
  onProgressData,
  onVolumeChangeData,
  TimedMetadata,
} from '../../core/types/Events';
import type { TextTrack } from '../../core/types/TextTrack';
import type { VideoPlayerStatus } from '../../core/types/VideoPlayerStatus';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VideoPlayerEvents } from '../../core/types/Events';

export interface ListenerSubscription {
  remove(): void;
}

export interface VideoPlayerEventEmitter
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Adds a listener for the `onAudioBecomingNoisy` event.
   * @see {@link VideoPlayerEvents.onAudioBecomingNoisy}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnAudioBecomingNoisyListener(listener: () => void): ListenerSubscription;

  /**
   * Adds a listener for the `onAudioFocusChange` event.
   * @see {@link VideoPlayerEvents.onAudioFocusChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnAudioFocusChangeListener(
    listener: (hasAudioFocus: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onBandwidthUpdate` event.
   * @see {@link VideoPlayerEvents.onBandwidthUpdate}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnBandwidthUpdateListener(
    listener: (data: BandwidthData) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onBuffer` event.
   * @see {@link VideoPlayerEvents.onBuffer}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnBufferListener(
    listener: (buffering: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onControlsVisibleChange` event.
   * @see {@link VideoPlayerEvents.onControlsVisibleChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnControlsVisibleChangeListener(
    listener: (visible: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onEnd` event.
   * @see {@link VideoPlayerEvents.onEnd}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnEndListener(listener: () => void): ListenerSubscription;

  /**
   * Adds a listener for the `onExternalPlaybackChange` event.
   * @see {@link VideoPlayerEvents.onExternalPlaybackChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnExternalPlaybackChangeListener(
    listener: (externalPlaybackActive: boolean) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onLoad` event.
   * @see {@link VideoPlayerEvents.onLoad}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnLoadListener(listener: (data: onLoadData) => void): ListenerSubscription;

  /**
   * Adds a listener for the `onLoadStart` event.
   * @see {@link VideoPlayerEvents.onLoadStart}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnLoadStartListener(
    listener: (data: onLoadStartData) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onPlaybackStateChange` event.
   * @see {@link VideoPlayerEvents.onPlaybackStateChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnPlaybackStateChangeListener(
    listener: (data: onPlaybackStateChangeData) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onPlaybackRateChange` event.
   * @see {@link VideoPlayerEvents.onPlaybackRateChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnPlaybackRateChangeListener(
    listener: (rate: number) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onProgress` event.
   * @see {@link VideoPlayerEvents.onProgress}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnProgressListener(
    listener: (data: onProgressData) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onReadyToDisplay` event.
   * @see {@link VideoPlayerEvents.onReadyToDisplay}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnReadyToDisplayListener(listener: () => void): ListenerSubscription;

  /**
   * Adds a listener for the `onSeek` event.
   * @see {@link VideoPlayerEvents.onSeek}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnSeekListener(listener: (position: number) => void): ListenerSubscription;

  /**
   * Adds a listener for the `onStatusChange` event.
   * @see {@link VideoPlayerEvents.onStatusChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnStatusChangeListener(
    listener: (status: VideoPlayerStatus) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onTimedMetadata` event.
   * @see {@link VideoPlayerEvents.onTimedMetadata}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnTimedMetadataListener(
    listener: (data: TimedMetadata) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onTextTrackDataChanged` event.
   * @see {@link VideoPlayerEvents.onTextTrackDataChanged}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnTextTrackDataChangedListener(
    listener: (data: string[]) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onTrackChange` event.
   * @see {@link VideoPlayerEvents.onTrackChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnTrackChangeListener(
    listener: (track: TextTrack | null) => void
  ): ListenerSubscription;

  /**
   * Adds a listener for the `onVolumeChange` event.
   * @see {@link VideoPlayerEvents.onVolumeChange}
   * @param listener - The listener to add.
   * @returns A subscription object that can be used to remove the listener.
   */
  addOnVolumeChangeListener(
    listener: (data: onVolumeChangeData) => void
  ): ListenerSubscription;

  /**
   * Clears all listeners from the event emitter.
   */
  clearAllListeners(): void;
}
