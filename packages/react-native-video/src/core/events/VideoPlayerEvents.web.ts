import type { AllPlayerEvents as PlayerEvents } from "../types/Events";
import type { ListenerSubscription } from "../types/EventEmitter";
import { VideoPlayerEventsBase } from "./VideoPlayerEventsBase";

export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event],
  ): ListenerSubscription {
    switch (event) {
      // Web-only events will be added here
      default:
        return super.addEventListener(event, callback);
    }
  }
}
