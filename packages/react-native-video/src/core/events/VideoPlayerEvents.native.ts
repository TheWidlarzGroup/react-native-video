import type {
  JSVideoPlayerEvents,
  AllPlayerEvents as PlayerEvents,
} from '../types/Events';
import type { ListenerSubscription } from '../types/EventEmitter';
import { VideoPlayerEventsBase } from './VideoPlayerEventsBase';

export class VideoPlayerEvents extends VideoPlayerEventsBase {
  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ): ListenerSubscription {
    switch (event) {
      // --- JS-only events ---
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
      // --- Shared events ---
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
      case 'onAdsResolved':
        return this.eventEmitter.addOnAdsResolvedListener(
          callback as PlayerEvents['onAdsResolved']
        );
      case 'onAdBreakStart':
        return this.eventEmitter.addOnAdBreakStartListener(
          callback as PlayerEvents['onAdBreakStart']
        );
      case 'onAdBreakEnd':
        return this.eventEmitter.addOnAdBreakEndListener(
          callback as PlayerEvents['onAdBreakEnd']
        );
      case 'onAdProgress':
        return this.eventEmitter.addOnAdProgressListener(
          callback as PlayerEvents['onAdProgress']
        );
      case 'onAdStart':
        return this.eventEmitter.addOnAdStartListener(
          callback as PlayerEvents['onAdStart']
        );
      case 'onAdComplete':
        return this.eventEmitter.addOnAdCompleteListener(
          callback as PlayerEvents['onAdComplete']
        );
      case 'onAdSkipped':
        return this.eventEmitter.addOnAdSkippedListener(
          callback as PlayerEvents['onAdSkipped']
        );
      case 'onAdClicked':
        return this.eventEmitter.addOnAdClickedListener(
          callback as PlayerEvents['onAdClicked']
        );
      case 'onAdError':
        return this.eventEmitter.addOnAdErrorListener(
          callback as PlayerEvents['onAdError']
        );
      case 'onAllAdsCompleted':
        return this.eventEmitter.addOnAllAdsCompletedListener(
          callback as PlayerEvents['onAllAdsCompleted']
        );
      case 'onAdStateChange':
        return this.eventEmitter.addOnAdStateChangeListener(
          callback as PlayerEvents['onAdStateChange']
        );
      // --- Native-only events ---
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
        throw new Error(`[React Native Video] Unsupported event: ${event}`);
    }
  }
}
