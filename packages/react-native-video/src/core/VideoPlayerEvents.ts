import type {
  ListenerSubscription,
  VideoPlayerEventEmitter,
} from '../spec/nitro/VideoPlayerEventEmitter.nitro';
import {
  ALL_PLAYER_EVENTS,
  type JSVideoPlayerEvents,
  type AllPlayerEvents as PlayerEvents,
} from './types/Events';

export class VideoPlayerEvents {
  protected eventEmitter: VideoPlayerEventEmitter;
  protected jsEventListeners: Partial<
    Record<keyof JSVideoPlayerEvents, Set<(..._params: any[]) => void>>
  > = {};

  protected readonly supportedEvents: (keyof PlayerEvents)[] =
    ALL_PLAYER_EVENTS;

  constructor(eventEmitter: VideoPlayerEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  protected triggerJSEvent<Event extends keyof JSVideoPlayerEvents>(
    event: Event,
    ...params: Parameters<JSVideoPlayerEvents[Event]>
  ): boolean {
    if (!this.jsEventListeners[event]) return false;
    this.jsEventListeners[event]?.forEach((fn) => fn(...params));
    return true;
  }

  /**
   * Adds a listener for a player event.
   * @throw Error if the event is not supported.
   * @param event - The event to add a listener for.
   * @param callback - The callback to call when the event is triggered.
   * @returns A subscription object that can be used to remove the listener.
   */
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ): ListenerSubscription {
    switch (event) {
      // ----------------- JS Events -----------------
      case 'onError':
        this.jsEventListeners.onError ??= new Set();
        this.jsEventListeners.onError.add(
          callback as JSVideoPlayerEvents['onError']
        );
        return {
          remove: () =>
            this.jsEventListeners.onError?.delete(
              callback as JSVideoPlayerEvents['onError']
            ),
        };
      // ----------------- Native Events -----------------
      case 'onAudioBecomingNoisy':
        return this.eventEmitter.addOnAudioBecomingNoisyListener(
          callback as PlayerEvents['onAudioBecomingNoisy']
        );
      case 'onAudioFocusChange':
        return this.eventEmitter.addOnAudioFocusChangeListener(
          callback as PlayerEvents['onAudioFocusChange']
        );
      case 'onBandwidthUpdate':
        return this.eventEmitter.addOnBandwidthUpdateListener(
          callback as PlayerEvents['onBandwidthUpdate']
        );
      case 'onBuffer':
        return this.eventEmitter.addOnBufferListener(
          callback as PlayerEvents['onBuffer']
        );
      case 'onControlsVisibleChange':
        return this.eventEmitter.addOnControlsVisibleChangeListener(
          callback as PlayerEvents['onControlsVisibleChange']
        );
      case 'onEnd':
        return this.eventEmitter.addOnEndListener(
          callback as PlayerEvents['onEnd']
        );
      case 'onExternalPlaybackChange':
        return this.eventEmitter.addOnExternalPlaybackChangeListener(
          callback as PlayerEvents['onExternalPlaybackChange']
        );
      case 'onLoad':
        return this.eventEmitter.addOnLoadListener(
          callback as PlayerEvents['onLoad']
        );
      case 'onLoadStart':
        return this.eventEmitter.addOnLoadStartListener(
          callback as PlayerEvents['onLoadStart']
        );
      case 'onPlaybackStateChange':
        return this.eventEmitter.addOnPlaybackStateChangeListener(
          callback as PlayerEvents['onPlaybackStateChange']
        );
      case 'onPlaybackRateChange':
        return this.eventEmitter.addOnPlaybackRateChangeListener(
          callback as PlayerEvents['onPlaybackRateChange']
        );
      case 'onProgress':
        return this.eventEmitter.addOnProgressListener(
          callback as PlayerEvents['onProgress']
        );
      case 'onReadyToDisplay':
        return this.eventEmitter.addOnReadyToDisplayListener(
          callback as PlayerEvents['onReadyToDisplay']
        );
      case 'onSeek':
        return this.eventEmitter.addOnSeekListener(
          callback as PlayerEvents['onSeek']
        );
      case 'onTimedMetadata':
        return this.eventEmitter.addOnTimedMetadataListener(
          callback as PlayerEvents['onTimedMetadata']
        );
      case 'onTextTrackDataChanged':
        return this.eventEmitter.addOnTextTrackDataChangedListener(
          callback as PlayerEvents['onTextTrackDataChanged']
        );
      case 'onTrackChange':
        return this.eventEmitter.addOnTrackChangeListener(
          callback as PlayerEvents['onTrackChange']
        );
      case 'onVolumeChange':
        return this.eventEmitter.addOnVolumeChangeListener(
          callback as PlayerEvents['onVolumeChange']
        );
      case 'onStatusChange':
        return this.eventEmitter.addOnStatusChangeListener(
          callback as PlayerEvents['onStatusChange']
        );
      default:
        throw new Error(`[React Native Video] Unsupported event: ${event}`);
    }
  }

  /**
   * Clears all events from the event emitter.
   */
  clearAllEvents() {
    this.jsEventListeners = {};
    this.eventEmitter.clearAllListeners();
  }
}
