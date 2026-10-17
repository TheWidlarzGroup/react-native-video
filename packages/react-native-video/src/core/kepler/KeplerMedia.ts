import { VideoPlayer as W3cVideoPlayer } from '@amazon-devices/react-native-w3cmedia';

/** HTMLMediaElement.HAVE_FUTURE_DATA */
export const HAVE_FUTURE_DATA = 3;

/**
 * One w3cmedia `VideoPlayer` behind the synchronous API of `VideoPlayer`.
 *
 * w3cmedia accepts no call before `initialize()` resolves, so earlier commands wait and run
 * in order. It also differs from an HTML `<video>` in two places this class hides:
 * `paused` stays false after `ended`, and `seeked` reports the time from before the seek.
 */
export class KeplerMedia {
  readonly video: W3cVideoPlayer;
  /** Resolves when the player is initialized; rejects when it cannot start. */
  readonly ready: Promise<void>;
  /** Changes with every source, so per-source events can be sent once. */
  sourceId = 0;

  private initialized = false;
  private destroyed = false;
  private pending: Array<() => void> = [];
  private surface: string | null = null;
  private ended = false;
  private seekTarget: number | null = null;
  // Written before initialize(): read back from here until the player exists.
  private state = { muted: false, volume: 1, rate: 1, loop: false };

  constructor() {
    this.video = new W3cVideoPlayer();
    this.ready = this.video.initialize().then(() => {
      if (this.destroyed) return;
      this.initialized = true;
      this.video.autoplay = false;
      const queued = this.pending;
      this.pending = [];
      queued.forEach((command) => command());
    });
    this.ready.catch(() => {}); // reported through initialize() and onError
    this.run(() => this.video.addEventListener('ended', this.onEnded));
  }

  private onEnded = () => {
    this.ended = true;
  };

  /** Runs now when the player is initialized, otherwise right after `initialize()`. */
  run(command: () => void): void {
    if (this.destroyed) return;
    if (this.initialized) command();
    else this.pending.push(command);
  }

  setSource(uri: string): void {
    this.sourceId++;
    this.ended = false;
    this.seekTarget = null;
    this.run(() => {
      this.video.src = uri;
    });
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

  /** The time the last seek went to; w3cmedia's own `currentTime` at `seeked` is stale. */
  takeSeekTarget(): number {
    const target = this.seekTarget ?? this.currentTime;
    this.seekTarget = null;
    return target;
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

  /** Remote and voice play/pause go to this player (needs the media entries in manifest.toml). */
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
    try {
      await this.ready;
    } catch {
      return;
    }
    this.video.removeEventListener('ended', this.onEnded);
    try {
      if (this.surface !== null) this.video.clearSurfaceHandle(this.surface);
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
