import type {
  JSVideoPlayerEvents,
  AllPlayerEvents as PlayerEvents,
} from '../types/Events';
import type { ListenerSubscription } from '../types/EventEmitter';
import {
  tryParseNativeVideoError,
  VideoError,
  VideoRuntimeError,
} from '../types/VideoError';
import { VideoPlayerEventsBase } from './VideoPlayerEventsBase';

export class VideoPlayerEvents extends VideoPlayerEventsBase {
  // One native subscription feeds every `onError` listener, so a callback added twice
  // is called once per failure, like for errors raised in JS.
  private nativeErrorSubscription?: ListenerSubscription;

  addEventListener<Event extends keyof PlayerEvents>(
    event: Event,
    callback: PlayerEvents[Event]
  ): ListenerSubscription {
    switch (event) {
      // --- JS-only events ---
      case 'onError': {
        this.jsEventListeners.onError ??= new Set();
        this.jsEventListeners.onError.add(
          callback as JSVideoPlayerEvents['onError']
        );
        // Asynchronous native failures (e.g. a source that fails to load) have no
        // promise to reject, so native reports them through the emitter instead.
        this.nativeErrorSubscription ??= this.eventEmitter.addOnErrorListener(
          (nativeError) => {
            const parsed = tryParseNativeVideoError({ message: nativeError });
            // A payload that does not parse is still a failure: report it rather
            // than drop it, so `onError` never stays silent.
            // A parsed error keeps its own code, whatever its class. Native only sends
            // `player/*` codes here, so a `view/*` error is not expected.
            const error =
              parsed instanceof VideoError
                ? (parsed as VideoRuntimeError)
                : new VideoRuntimeError('player/playback-failed', nativeError);
            this.triggerJSEvent('onError', error);
          }
        );
        return {
          remove: () => {
            const listeners = this.jsEventListeners.onError;
            listeners?.delete(callback as JSVideoPlayerEvents['onError']);
            if (!listeners?.size) {
              this.nativeErrorSubscription?.remove();
              this.nativeErrorSubscription = undefined;
            }
          },
        };
      }
      case 'onAdEvent': {
        const emit = callback as JSVideoPlayerEvents['onAdEvent'];
        const emitter = this.eventEmitter;
        // Composed from the individual native listeners, so no native change is involved.
        const subscriptions = [
          emitter.addOnAdsResolvedListener((data) =>
            emit({ type: 'adsResolved', data })
          ),
          emitter.addOnAdBreakStartListener((data) =>
            emit({ type: 'adBreakStart', data })
          ),
          emitter.addOnAdBreakEndListener((data) =>
            emit({ type: 'adBreakEnd', data })
          ),
          emitter.addOnAdProgressListener((data) =>
            emit({ type: 'adProgress', data })
          ),
          emitter.addOnAdStartListener((data) =>
            emit({ type: 'adStart', data })
          ),
          emitter.addOnAdCompleteListener((data) =>
            emit({ type: 'adComplete', data })
          ),
          emitter.addOnAdSkippedListener((data) =>
            emit({ type: 'adSkipped', data })
          ),
          emitter.addOnAdClickedListener(() =>
            emit({ type: 'adClicked', data: undefined })
          ),
          emitter.addOnAdErrorListener((data) =>
            emit({ type: 'adError', data })
          ),
          emitter.addOnAllAdsCompletedListener(() =>
            emit({ type: 'allAdsCompleted', data: undefined })
          ),
          emitter.addOnAdStateChangeListener((data) =>
            emit({ type: 'adStateChange', data })
          ),
        ];
        return {
          remove: () =>
            subscriptions.forEach((subscription) => subscription.remove()),
        };
      }
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

  clearAllEvents() {
    super.clearAllEvents();
    // The native listener is gone with the others: subscribe again on the next `onError`.
    this.nativeErrorSubscription = undefined;
  }
}
