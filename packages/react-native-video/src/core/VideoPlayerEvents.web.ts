import type { AllPlayerEvents as PlayerEvents } from "./types/Events";
import type { ListenerSubscription } from "./types/EventEmitter";
import { VideoPlayerEventsBase } from "./VideoPlayerEventsBase";
import type { WebEventEmitter } from "./web/WebEventEmitter";

export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event],
  ): ListenerSubscription {
    switch (event) {
      // ----------------- Web-only Events -----------------
      case 'onAudioTrackChange':
        return (this.eventEmitter as WebEventEmitter).addOnAudioTrackChangeListener(
          callback as PlayerEvents['onAudioTrackChange']
        );
      case 'onVideoTrackChange':
        return (this.eventEmitter as WebEventEmitter).addOnVideoTrackChangeListener(
          callback as PlayerEvents['onVideoTrackChange']
        );
      case 'onQualityChange':
        return (this.eventEmitter as WebEventEmitter).addOnQualityChangeListener(
          callback as PlayerEvents['onQualityChange']
        );
      default:
        return super.addEventListener(event, callback);
    }
  }
}
