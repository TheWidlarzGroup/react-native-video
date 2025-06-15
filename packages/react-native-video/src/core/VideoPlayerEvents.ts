import type { VideoPlayerEventEmitter } from '../spec/nitro/VideoPlayerEventEmitter.nitro';
import type { VideoPlayerEvents as VideoPlayerEventsInterface } from './types/Events';

export class VideoPlayerEvents implements VideoPlayerEventsInterface {
  protected eventEmitter: VideoPlayerEventEmitter;

  protected readonly supportedEvents: (keyof VideoPlayerEventsInterface)[] = [
    'onAudioBecomingNoisy',
    'onAudioFocusChange',
    'onBandwidthUpdate',
    'onBuffer',
    'onControlsVisibleChange',
    'onEnd',
    'onExternalPlaybackChange',
    'onLoad',
    'onLoadStart',
    'onPlaybackRateChange',
    'onPlaybackStateChange',
    'onProgress',
    'onReadyToDisplay',
    'onSeek',
    'onStatusChange',
    'onTextTrackDataChanged',
    'onTimedMetadata',
    'onTrackChange',
    'onVolumeChange',
  ];

  constructor(eventEmitter: VideoPlayerEventEmitter) {
    this.eventEmitter = eventEmitter;
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
  clearEvent(event: keyof VideoPlayerEventsInterface) {
    this.eventEmitter[event] = VideoPlayerEvents.NOOP;
  }

  static NOOP = () => {};

  set onAudioBecomingNoisy(
    value: VideoPlayerEventsInterface['onAudioBecomingNoisy']
  ) {
    this.eventEmitter.onAudioBecomingNoisy = value;
  }

  get onAudioBecomingNoisy(): VideoPlayerEventsInterface['onAudioBecomingNoisy'] {
    return this.eventEmitter.onAudioBecomingNoisy;
  }

  set onAudioFocusChange(
    value: VideoPlayerEventsInterface['onAudioFocusChange']
  ) {
    this.eventEmitter.onAudioFocusChange = value;
  }

  get onAudioFocusChange(): VideoPlayerEventsInterface['onAudioFocusChange'] {
    return this.eventEmitter.onAudioFocusChange;
  }

  set onBandwidthUpdate(
    value: VideoPlayerEventsInterface['onBandwidthUpdate']
  ) {
    this.eventEmitter.onBandwidthUpdate = value;
  }

  get onBandwidthUpdate(): VideoPlayerEventsInterface['onBandwidthUpdate'] {
    return this.eventEmitter.onBandwidthUpdate;
  }

  set onBuffer(value: VideoPlayerEventsInterface['onBuffer']) {
    this.eventEmitter.onBuffer = value;
  }

  get onBuffer(): VideoPlayerEventsInterface['onBuffer'] {
    return this.eventEmitter.onBuffer;
  }

  set onControlsVisibleChange(
    value: VideoPlayerEventsInterface['onControlsVisibleChange']
  ) {
    this.eventEmitter.onControlsVisibleChange = value;
  }

  get onControlsVisibleChange(): VideoPlayerEventsInterface['onControlsVisibleChange'] {
    return this.eventEmitter.onControlsVisibleChange;
  }

  set onEnd(value: VideoPlayerEventsInterface['onEnd']) {
    this.eventEmitter.onEnd = value;
  }

  get onEnd(): VideoPlayerEventsInterface['onEnd'] {
    return this.eventEmitter.onEnd;
  }

  set onExternalPlaybackChange(
    value: VideoPlayerEventsInterface['onExternalPlaybackChange']
  ) {
    this.eventEmitter.onExternalPlaybackChange = value;
  }

  get onExternalPlaybackChange(): VideoPlayerEventsInterface['onExternalPlaybackChange'] {
    return this.eventEmitter.onExternalPlaybackChange;
  }

  set onLoad(value: VideoPlayerEventsInterface['onLoad']) {
    this.eventEmitter.onLoad = value;
  }

  get onLoad(): VideoPlayerEventsInterface['onLoad'] {
    return this.eventEmitter.onLoad;
  }

  set onLoadStart(value: VideoPlayerEventsInterface['onLoadStart']) {
    this.eventEmitter.onLoadStart = value;
  }

  get onLoadStart(): VideoPlayerEventsInterface['onLoadStart'] {
    return this.eventEmitter.onLoadStart;
  }

  set onPlaybackStateChange(
    value: VideoPlayerEventsInterface['onPlaybackStateChange']
  ) {
    this.eventEmitter.onPlaybackStateChange = value;
  }

  get onPlaybackStateChange(): VideoPlayerEventsInterface['onPlaybackStateChange'] {
    return this.eventEmitter.onPlaybackStateChange;
  }

  set onPlaybackRateChange(
    value: VideoPlayerEventsInterface['onPlaybackRateChange']
  ) {
    this.eventEmitter.onPlaybackRateChange = value;
  }

  get onPlaybackRateChange(): VideoPlayerEventsInterface['onPlaybackRateChange'] {
    return this.eventEmitter.onPlaybackRateChange;
  }

  set onProgress(value: VideoPlayerEventsInterface['onProgress']) {
    this.eventEmitter.onProgress = value;
  }

  get onProgress(): VideoPlayerEventsInterface['onProgress'] {
    return this.eventEmitter.onProgress;
  }

  set onReadyToDisplay(value: VideoPlayerEventsInterface['onReadyToDisplay']) {
    this.eventEmitter.onReadyToDisplay = value;
  }

  get onReadyToDisplay(): VideoPlayerEventsInterface['onReadyToDisplay'] {
    return this.eventEmitter.onReadyToDisplay;
  }

  set onSeek(value: VideoPlayerEventsInterface['onSeek']) {
    this.eventEmitter.onSeek = value;
  }

  get onSeek(): VideoPlayerEventsInterface['onSeek'] {
    return this.eventEmitter.onSeek;
  }

  set onStatusChange(value: VideoPlayerEventsInterface['onStatusChange']) {
    this.eventEmitter.onStatusChange = value;
  }

  get onStatusChange(): VideoPlayerEventsInterface['onStatusChange'] {
    return this.eventEmitter.onStatusChange;
  }

  set onTimedMetadata(value: VideoPlayerEventsInterface['onTimedMetadata']) {
    this.eventEmitter.onTimedMetadata = value;
  }

  get onTimedMetadata(): VideoPlayerEventsInterface['onTimedMetadata'] {
    return this.eventEmitter.onTimedMetadata;
  }

  set onTextTrackDataChanged(
    value: VideoPlayerEventsInterface['onTextTrackDataChanged']
  ) {
    this.eventEmitter.onTextTrackDataChanged = value;
  }

  get onTextTrackDataChanged(): VideoPlayerEventsInterface['onTextTrackDataChanged'] {
    return this.eventEmitter.onTextTrackDataChanged;
  }

  set onTrackChange(value: VideoPlayerEventsInterface['onTrackChange']) {
    this.eventEmitter.onTrackChange = value;
  }

  get onTrackChange(): VideoPlayerEventsInterface['onTrackChange'] {
    return this.eventEmitter.onTrackChange;
  }

  set onVolumeChange(value: VideoPlayerEventsInterface['onVolumeChange']) {
    this.eventEmitter.onVolumeChange = value;
  }

  get onVolumeChange(): VideoPlayerEventsInterface['onVolumeChange'] {
    return this.eventEmitter.onVolumeChange;
  }
}
