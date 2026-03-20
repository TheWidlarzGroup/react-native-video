import type {
  BandwidthData,
  onLoadData,
  onLoadStartData,
  onPlaybackStateChangeData,
  onProgressData,
  onVolumeChangeData,
  TimedMetadata,
} from "./Events";
import type { TextTrack } from "./TextTrack";
import type { VideoPlayerStatus } from "./VideoPlayerStatus";

/**
 * A subscription that can be used to remove a listener.
 */
export interface ListenerSubscription {
  remove(): void;
}

/**
 * Base interface for the video player event emitter.
 * Both native (Nitro) and web implementations must conform to this interface.
 */
export interface VideoPlayerEventEmitterBase {
  addOnAudioBecomingNoisyListener(listener: () => void): ListenerSubscription;
  addOnAudioFocusChangeListener(
    listener: (hasAudioFocus: boolean) => void,
  ): ListenerSubscription;
  addOnBandwidthUpdateListener(
    listener: (data: BandwidthData) => void,
  ): ListenerSubscription;
  addOnBufferListener(
    listener: (buffering: boolean) => void,
  ): ListenerSubscription;
  addOnControlsVisibleChangeListener(
    listener: (visible: boolean) => void,
  ): ListenerSubscription;
  addOnEndListener(listener: () => void): ListenerSubscription;
  addOnExternalPlaybackChangeListener(
    listener: (externalPlaybackActive: boolean) => void,
  ): ListenerSubscription;
  addOnLoadListener(listener: (data: onLoadData) => void): ListenerSubscription;
  addOnLoadStartListener(
    listener: (data: onLoadStartData) => void,
  ): ListenerSubscription;
  addOnPlaybackStateChangeListener(
    listener: (data: onPlaybackStateChangeData) => void,
  ): ListenerSubscription;
  addOnPlaybackRateChangeListener(
    listener: (rate: number) => void,
  ): ListenerSubscription;
  addOnProgressListener(
    listener: (data: onProgressData) => void,
  ): ListenerSubscription;
  addOnReadyToDisplayListener(listener: () => void): ListenerSubscription;
  addOnSeekListener(listener: (position: number) => void): ListenerSubscription;
  addOnStatusChangeListener(
    listener: (status: VideoPlayerStatus) => void,
  ): ListenerSubscription;
  addOnTimedMetadataListener(
    listener: (data: TimedMetadata) => void,
  ): ListenerSubscription;
  addOnTextTrackDataChangedListener(
    listener: (data: string[]) => void,
  ): ListenerSubscription;
  addOnTrackChangeListener(
    listener: (track: TextTrack | null) => void,
  ): ListenerSubscription;
  addOnVolumeChangeListener(
    listener: (data: onVolumeChangeData) => void,
  ): ListenerSubscription;
  clearAllListeners(): void;
}
