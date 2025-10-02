import type { VideoPlayerEventEmitter } from '../spec/nitro/VideoPlayerEventEmitter.nitro';
import {
  ALL_PLAYER_EVENTS,
  type AllPlayerEvents as PlayerEvents,
} from './types/Events';

export class VideoPlayerEvents {
  protected eventEmitter: VideoPlayerEventEmitter;
  protected eventListeners: Partial<
    Record<keyof PlayerEvents, Set<(...params: any[]) => void>>
  > = {};

  protected readonly supportedEvents: (keyof PlayerEvents)[] =
    ALL_PLAYER_EVENTS;

  constructor(eventEmitter: VideoPlayerEventEmitter) {
    this.eventEmitter = eventEmitter;
    for (let event of this.supportedEvents) {
      // @ts-expect-error we narrow the type of the event
      this.eventEmitter[event] = this.triggerEvent.bind(this, event);
    }
  }

  protected triggerEvent<Event extends keyof PlayerEvents>(
    event: Event,
    ...params: Parameters<PlayerEvents[Event]>
  ): boolean {
    if (!this.eventListeners[event]?.size) return false;
    for (let fn of this.eventListeners[event]) {
      fn(...params);
    }
    return true;
  }

  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ) {
    this.eventListeners[event] ??= new Set<PlayerEvents[Event]>();
    this.eventListeners[event].add(callback);
  }

  removeEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ) {
    this.eventListeners[event]?.delete(callback);
  }

  /**
   * Clears all events from the event emitter.
   */
  clearAllEvents() {
    this.supportedEvents.forEach((event) => {
      this.clearEvent(event);
    });
  }

  /**
   * Clears a specific event from the event emitter.
   * @param event - The name of the event to clear.
   */
  clearEvent(event: keyof PlayerEvents) {
    this.eventListeners[event]?.clear();
  }
}
