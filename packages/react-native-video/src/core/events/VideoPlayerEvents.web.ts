import type { AllPlayerEvents as PlayerEvents } from '../types/Events';
import type { ListenerSubscription } from '../types/EventEmitter';
import { VideoPlayerEventsBase } from './VideoPlayerEventsBase';
import type { WebEventEmitter } from '../web/WebEventEmitter';

/**
 * Web event dispatch — all events (including onError) go through
 * WebEventEmitter.addListener(). No switch, no special cases.
 *
 * This file must exist so the bundler doesn't fall back to
 * VideoPlayerEvents.ts which re-exports the native version.
 */
export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ): ListenerSubscription {
    return (this.eventEmitter as unknown as WebEventEmitter).addListener(
      event,
      callback as (...args: any[]) => void
    );
  }
}
