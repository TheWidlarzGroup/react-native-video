import { VideoPlayer as W3cVideoPlayer } from '@amazon-devices/react-native-w3cmedia';
import { warnOnce } from './warnOnce';

/** HTMLMediaElement.HAVE_FUTURE_DATA */
export const HAVE_FUTURE_DATA = 3;

/**
 * One w3cmedia `VideoPlayer` behind the synchronous `VideoPlayer` API.
 * Commands wait for `initialize()`. Also tracks what w3cmedia reports wrong:
 * the end (`paused` stays false) and the last seek target (`seeked` is stale).
 */
export class KeplerMedia {
  readonly video: W3cVideoPlayer;
  /** Settles after start(): resolves on init, rejects if init fails. */
  readonly ready: Promise<void>;
  /** Bumped per source, so per-source events fire once. */
  sourceId = 0;

  private started = false;
  private begin: () => void = () => {};
  private initialized = false;
  private destroyed = false;
  private pending: Array<() => void> = [];
  private surface: string | null = null;
  private ended = false;
  private seekTarget: number | null = null;
  // Set before initialize(); read from here until the player exists.
  private state = { muted: false, volume: 1, rate: 1, loop: false };
  private ownListeners: Array<[string, () => void]> = [
    ['ended', () => (this.ended = true)],
    // Remote and voice resume w3cmedia without play().
    ['play', () => (this.ended = false)],
    ['seeking', () => (this.ended = false)],
  ];

  constructor() {
    this.video = new W3cVideoPlayer();
    this.ready = new Promise<void>((resolve) => {
      this.begin = () => resolve(this.video.initialize());
    }).then(() => {
      if (this.destroyed) return;
      this.initialized = true;
      this.video.autoplay = false;
      const queued = this.pending;
      this.pending = [];
      queued.forEach((command) => command());
    });
    this.ready.catch(() => {}); // reported through initialize() and onError
    // Queued first: this state is current when the listeners run.
    this.run(() => {
      this.ownListeners.forEach(([type, listener]) =>
        this.video.addEventListener(type, listener)
      );
    });
  }

  /** Initializes w3cmedia once; nothing is allocated before. */
  start(): void {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.begin();
  }

  /** Runs now, or right after `initialize()`. */
  run(command: () => void): void {
    if (this.destroyed) return;
    if (this.initialized) command();
    else this.pending.push(command);
  }

  setSource(uri: string, headers?: Record<string, string>): void {
    this.newSource();
    this.start();
    this.run(() => {
      // setSrcWithCustomHeaders is in newer w3cmedia versions only.
      if (headers && this.video.setSrcWithCustomHeaders) {
        this.video.setSrcWithCustomHeaders(uri, headers);
        return;
      }
      if (headers) warnOnce('`headers` (with this w3cmedia version)');
      this.video.src = uri;
    });
  }

  /** Like `removeAttribute('src')` on the web. */
  unload(): void {
    this.newSource();
    this.run(() => {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    });
  }

  private newSource() {
    this.sourceId++;
    this.ended = false;
    this.seekTarget = null;
  }

  play(): void {
    this.ended = false;
    this.run(() => {
      this.video.play().catch(() => {}); // a failed start arrives as an 'error' event
    });
  }

  pause(): void {
    this.run(() => this.video.pause());
  }

  seek(time: number): void {
    this.ended = false;
    this.seekTarget = time;
    this.run(() => {
      this.video.currentTime = time;
    });
  }

  /** Target of the seek in flight. */
  get pendingSeek(): number | null {
    return this.seekTarget;
  }

  /** Last seek target (`currentTime` at `seeked` is stale); null for a loop restart. */
  takeSeekTarget(): number | null {
    const target = this.seekTarget;
    this.seekTarget = null;
    if (target !== null) return target;
    const atLoopPoint = this.loop && this.currentTime >= this.duration - 1;
    return atLoopPoint ? null : this.currentTime;
  }

  setMuted(muted: boolean): void {
    this.state.muted = muted;
    this.run(() => {
      this.video.muted = muted;
    });
  }

  setVolume(volume: number): void {
    this.state.volume = volume;
    this.run(() => {
      this.video.volume = volume;
    });
  }

  setRate(rate: number): void {
    this.state.rate = rate;
    this.run(() => {
      this.video.playbackRate = rate;
    });
  }

  setLoop(loop: boolean): void {
    this.state.loop = loop;
    this.run(() => {
      this.video.loop = loop;
    });
  }

  /** Remote and voice play/pause control this player (needs manifest entries). */
  takeMediaControlFocus(componentInstance: unknown): void {
    this.run(() => {
      this.video.setMediaControlFocus(componentInstance).catch(() => {});
    });
  }

  attachSurface(handle: string): void {
    // The view may report the same surface twice.
    if (this.surface === handle) return;
    const previous = this.surface;
    this.surface = handle;
    this.run(() => {
      if (previous !== null) this.video.clearSurfaceHandle(previous);
      this.video.setSurfaceHandle(handle);
    });
  }

  detachSurface(handle: string): void {
    if (this.surface !== handle) return;
    this.surface = null;
    this.run(() => this.video.clearSurfaceHandle(handle));
  }

  /** Amazon's order: clear the surface, then deinitialize. Never rejects. */
  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pending = [];
    // Read now: the view may detach it while we wait. Before init it never reached w3cmedia.
    const surface = this.initialized ? this.surface : null;
    // The getters return defaults from here on.
    this.initialized = false;
    if (!this.started) return; // w3cmedia was never initialized: nothing to release
    try {
      await this.ready;
    } catch {
      return;
    }
    this.ownListeners.forEach(([type, listener]) =>
      this.video.removeEventListener(type, listener)
    );
    try {
      if (surface !== null) {
        this.video.clearSurfaceHandle(surface);
      }
      this.video.pause();
    } catch {
      // The player is released below anyway.
    }
    this.surface = null;
    await this.video.deinitialize().catch(() => {});
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
  get isEnded(): boolean {
    return this.ended;
  }
  get paused(): boolean {
    return !this.initialized || this.ended || this.video.paused;
  }
  get currentTime(): number {
    return this.initialized ? this.video.currentTime : 0;
  }
  get duration(): number {
    return this.initialized ? this.video.duration : NaN;
  }
  get readyState(): number {
    return this.initialized ? this.video.readyState : 0;
  }
  get error() {
    return this.initialized ? this.video.error : null;
  }
  get muted(): boolean {
    return this.initialized ? this.video.muted : this.state.muted;
  }
  get volume(): number {
    return this.initialized ? this.video.volume : this.state.volume;
  }
  get rate(): number {
    return this.initialized ? this.video.playbackRate : this.state.rate;
  }
  get loop(): boolean {
    return this.initialized ? this.video.loop : this.state.loop;
  }
  get width(): number {
    return this.initialized ? this.video.videoWidth : 0;
  }
  get height(): number {
    return this.initialized ? this.video.videoHeight : 0;
  }

  /** Seconds buffered ahead of the playhead. */
  get bufferAhead(): number {
    if (!this.initialized) return 0;
    const buffered = this.video.buffered;
    const time = this.video.currentTime;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= time && time <= buffered.end(i)) {
        return buffered.end(i) - time;
      }
    }
    return 0;
  }
}
