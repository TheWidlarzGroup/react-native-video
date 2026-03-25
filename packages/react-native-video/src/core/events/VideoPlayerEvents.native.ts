import type { AllPlayerEvents as PlayerEvents } from "../types/Events";
import type { ListenerSubscription } from "../types/EventEmitter";
import { VideoPlayerEventsBase } from "./VideoPlayerEventsBase";

export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event],
  ): ListenerSubscription {
    switch (event) {
      // ----------------- Native-only Events -----------------
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
      case 'onControlsVisibleChange':
        return this.eventEmitter.addOnControlsVisibleChangeListener(
          callback as PlayerEvents['onControlsVisibleChange']
        );
      case 'onExternalPlaybackChange':
        return this.eventEmitter.addOnExternalPlaybackChangeListener(
          callback as PlayerEvents['onExternalPlaybackChange']
        );
      case 'onTimedMetadata':
        return this.eventEmitter.addOnTimedMetadataListener(
          callback as PlayerEvents['onTimedMetadata']
        );
      case 'onTextTrackDataChanged':
        return this.eventEmitter.addOnTextTrackDataChangedListener(
          callback as PlayerEvents['onTextTrackDataChanged']
        );
      default:
        return super.addEventListener(event, callback);
    }
  }
}
