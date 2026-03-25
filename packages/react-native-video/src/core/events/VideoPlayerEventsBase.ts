import {
  ALL_PLAYER_EVENTS,
  type JSVideoPlayerEvents,
  type AllPlayerEvents as PlayerEvents,
} from "../types/Events";
import type {
  ListenerSubscription,
  VideoPlayerEventEmitterBase,
} from "../types/EventEmitter";

export class VideoPlayerEventsBase {
  protected eventEmitter: VideoPlayerEventEmitterBase;
  protected jsEventListeners: Partial<
    Record<keyof PlayerEvents, Set<(...params: any[]) => void>>
  > = {};

  protected readonly supportedEvents: (keyof PlayerEvents)[] =
    ALL_PLAYER_EVENTS;

  constructor(eventEmitter: VideoPlayerEventEmitterBase) {
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
      // ----------------- Shared Events -----------------
      case 'onBuffer':
        return this.eventEmitter.addOnBufferListener(
          callback as PlayerEvents['onBuffer']
        );
      case 'onEnd':
        return this.eventEmitter.addOnEndListener(
          callback as PlayerEvents['onEnd']
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

  clearAllEvents() {
    this.jsEventListeners = {};
    this.eventEmitter.clearAllListeners();
  }
}
