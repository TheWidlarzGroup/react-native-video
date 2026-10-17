import type { AllPlayerEvents as PlayerEvents } from '../types/Events';
import type { ListenerSubscription } from '../types/EventEmitter';
import { VideoPlayerEventsBase } from './VideoPlayerEventsBase';
import type { KeplerEventEmitter } from '../kepler/KeplerEventEmitter';

/**
 * Vega event dispatch, like the web one: all events go through KeplerEventEmitter.
 * VideoPlayer.kepler.ts imports it directly, so nothing on Vega reaches
 * VideoPlayerEvents.native.ts, which needs Nitro.
 */
export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ): ListenerSubscription {
    return (this.eventEmitter as unknown as KeplerEventEmitter).addListener(
      event,
      callback as (...args: any[]) => void
    );
  }
}
