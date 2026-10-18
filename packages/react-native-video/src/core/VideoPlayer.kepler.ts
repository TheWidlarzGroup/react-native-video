import type { IgnoreSilentSwitchMode } from './types/IgnoreSilentSwitchMode';
import type { MixAudioMode } from './types/MixAudioMode';
import type { TextTrack } from './types/TextTrack';
import type { NoAutocomplete } from './types/Utils';
import type {
  NativeVideoConfig,
  VideoConfig,
  VideoSource,
} from './types/VideoConfig';
import { VideoRuntimeError } from './types/VideoError';
import type { VideoPlayerBase } from './types/VideoPlayerBase';
import type { VideoPlayerSourceBase } from './types/VideoPlayerSourceBase';
import type { VideoPlayerStatus } from './types/VideoPlayerStatus';
// Explicit path for the bun tests; Metro picks the .kepler file either way.
import { VideoPlayerEvents } from './events/VideoPlayerEvents.kepler';
import { KeplerEventEmitter } from './kepler/KeplerEventEmitter';
import { HAVE_FUTURE_DATA, KeplerMedia } from './kepler/KeplerMedia';
import { warnOnce } from './kepler/warnOnce';

/**
 * Vega OS (Fire TV) backend: one w3cmedia `VideoPlayer` in URL mode.
 * Structured like `VideoPlayer.web.ts`.
 */
class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  private _media: KeplerMedia;
  /** `_media.ready` that rejects with the error reported to onError. */
  private _ready: Promise<void>;
  private _initError: VideoRuntimeError | null = null;
  private _source: NativeVideoConfig | undefined;
  /** False while `initializeOnCreation: false` delays the load. */
  private _sourceLoaded = false;
  private _released = false;
  private _showNotificationControls = false;
  private _playInBackground = false;
  private _componentInstance: (() => unknown) | null = null;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSourceBase) {
    const media = new KeplerMedia();
    const emitter = new KeplerEventEmitter(media);
    // KeplerEventEmitter uses generic dispatch, cast to satisfy base class
    super(emitter as any);
    emitter.getSource = () => this.source;
    this._media = media;

    this._ready = media.ready.catch((cause: unknown) => {
      const error = new VideoRuntimeError(
        'player/not-initialized',
        `w3cmedia VideoPlayer could not start: ${String(cause)}`
      );
      this._initError = error;
      emitter.__emit('onStatusChange', 'error');
      emitter.__emit('onError', error);
      throw error;
    });
    this._ready.catch(() => {}); // the app hears it through onError

    this.replaceSourceAsync(source).catch(() => {});
  }

  // --- Internal (used by VideoView) ---

  /** @internal */
  __attachSurface(handle: string) {
    this._media.attachSurface(handle);
  }

  /** @internal */
  __detachSurface(handle: string) {
    this._media.detachSurface(handle);
  }

  /** @internal For remote and voice play/pause. */
  __setComponentInstance(getInstance: (() => unknown) | null) {
    this._componentInstance = getInstance;
    this.focusMediaControls();
  }

  /** @internal Pauses in the background unless `playInBackground`. */
  __onAppStateChange(state: unknown) {
    if (state === 'background' && !this._playInBackground) this.pause();
  }

  /** @internal */
  __destroy() {
    if (this._released) return;
    this._released = true;
    (this.eventEmitter as unknown as KeplerEventEmitter).destroy();
    this.clearAllEvents();
    this._media.destroy().catch(() => {});
  }

  // --- Playback state ---

  get source(): VideoPlayerSourceBase {
    return {
      uri: this._source?.uri ?? '',
      config: this._source ?? { uri: '' },
      getAssetInformationAsync: async () => ({
        bitrate: NaN,
        width: this._media.width,
        height: this._media.height,
        duration: this.duration,
        fileSize: -1n,
        isHDR: false,
        isLive: false,
        orientation: 'landscape' as const,
      }),
    };
  }

  get status(): VideoPlayerStatus {
    if (this._released) return 'idle';
    if (this._initError || this._media.error) return 'error';
    if (this._media.isEnded || !this._sourceLoaded) return 'idle';
    if (this._media.readyState >= HAVE_FUTURE_DATA) return 'readyToPlay';
    return 'loading';
  }

  get duration(): number {
    return this._media.duration || NaN;
  }
  get currentTime(): number {
    return this._media.currentTime;
  }
  set currentTime(time: number) {
    this.seekTo(time);
  }
  get isPlaying(): boolean {
    return !this._media.paused;
  }

  get volume(): number {
    return this._media.volume;
  }
  set volume(volume: number) {
    this._media.setVolume(Math.max(0, Math.min(1, volume)));
  }
  get muted(): boolean {
    return this._media.muted;
  }
  set muted(muted: boolean) {
    this._media.setMuted(muted);
  }
  get loop(): boolean {
    return this._media.loop;
  }
  set loop(loop: boolean) {
    this._media.setLoop(loop);
  }
  get rate(): number {
    return this._media.rate;
  }
  set rate(rate: number) {
    this._media.setRate(rate);
  }

  // --- Media controls ---

  /** Vega: remote play/pause and "Alexa, pause" control this player (needs manifest entries). */
  get showNotificationControls(): boolean {
    return this._showNotificationControls;
  }
  set showNotificationControls(value: boolean) {
    this._showNotificationControls = value;
    this.focusMediaControls();
  }

  private focusMediaControls() {
    const instance = this._componentInstance?.();
    if (this._showNotificationControls && instance) {
      this._media.takeMediaControlFocus(instance);
    }
  }

  // --- Background ---

  /** Vega: false pauses the shown player when the app goes to the background. */
  get playInBackground(): boolean {
    return this._playInBackground;
  }
  set playInBackground(value: boolean) {
    this._playInBackground = value;
  }

  // --- Unsupported on Vega (no-op) ---

  get mixAudioMode(): MixAudioMode {
    return 'auto';
  }
  set mixAudioMode(_: MixAudioMode) {}
  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode {
    return 'auto';
  }
  set ignoreSilentSwitchMode(_: IgnoreSilentSwitchMode) {}
  get playWhenInactive(): boolean {
    return false;
  }
  set playWhenInactive(_: boolean) {}
  get disableAudioSessionManagement(): boolean {
    return false;
  }
  set disableAudioSessionManagement(_: boolean) {}

  // --- Playback actions ---

  async initialize(): Promise<void> {
    this.throwIfReleased();
    this._media.start();
    this.loadSource();
    await this._ready;
  }

  async preload(): Promise<void> {
    await this.initialize();
  }

  release(): void {
    this.__destroy();
  }

  play(): void {
    if (!this._source) return;
    this.loadSource();
    this._media.play();
  }

  pause(): void {
    this._media.pause();
  }

  seekTo(time: number): void {
    if (!this._source) return;
    this._media.seek(time);
  }

  seekBy(time: number): void {
    this.seekTo((this._media.pendingSeek ?? this.currentTime) + time);
  }

  // --- Source management ---

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSourceBase>
      | null
  ): Promise<void> {
    this.throwIfReleased();
    if (!source) {
      this._source = undefined;
      this._sourceLoaded = false;
      this._media.unload();
      return;
    }

    if (typeof source === 'string') {
      source = { uri: source };
    }

    if (typeof source === 'number' || typeof source.uri === 'number') {
      console.error(
        'A source uri must be a string. Numbers are only supported on iOS and Android.'
      );
      return;
    }

    const config = (
      'config' in source ? source.config : source
    ) as NativeVideoConfig;
    if (config.drm) warnOnce('`drm`');
    if (config.externalSubtitles?.length) warnOnce('`externalSubtitles`');

    this._source = config;
    this._sourceLoaded = false;
    if (config.initializeOnCreation !== false) {
      await this.initialize();
    }
  }

  /** As on iOS and Android. */
  private throwIfReleased() {
    if (this._released) {
      throw new VideoRuntimeError(
        'player/released',
        "You can't access player after it's released"
      );
    }
  }

  /** Loads the source into w3cmedia once: at creation or at initialize/preload/play. */
  private loadSource() {
    if (this._sourceLoaded || !this._source) return;
    this._sourceLoaded = true;
    const { uri, headers } = this._source;
    const hasHeaders = headers && Object.keys(headers).length > 0;
    this._media.setSource(uri, hasHeaders ? headers : undefined);
  }

  // --- Tracks (not on Vega yet) ---

  getAvailableTextTracks(): TextTrack[] {
    return [];
  }
  selectTextTrack(_: TextTrack | null): void {}
  get selectedTrack(): TextTrack | undefined {
    return undefined;
  }
}

export { VideoPlayer };
