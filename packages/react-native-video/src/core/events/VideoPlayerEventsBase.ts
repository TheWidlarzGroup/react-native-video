import {
  ALL_PLAYER_EVENTS,
  type JSVideoPlayerEvents,
  type AllPlayerEvents as PlayerEvents,
} from '../types/Events';
import type {
  ListenerSubscription,
  VideoPlayerEventEmitterBase,
} from '../types/EventEmitter';

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
    _event: Event,
    _callback: PlayerEvents[Event]
  ): ListenerSubscription {
    throw new Error(
      '[React Native Video] addEventListener must be implemented by platform'
    );
  }

  clearAllEvents() {
    this.jsEventListeners = {};
    this.eventEmitter.clearAllListeners();
  }
}
