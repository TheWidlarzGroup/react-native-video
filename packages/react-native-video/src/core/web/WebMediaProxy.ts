import type { VideoStore } from './VideoStore';

/**
 * Unified read/write access to video state.
 * Reads from video.js store when available, falls back to HTMLVideoElement.
 * Shared by VideoPlayer and WebEventEmitter.
 */
export class WebMediaProxy {
  private _storeRef: WeakRef<VideoStore> | null = null;

  constructor(readonly video: HTMLVideoElement) {}

  get store(): VideoStore | null {
    const store = this._storeRef?.deref() ?? null;
    return store?.destroyed ? null : store;
  }

  setStore(store: VideoStore | null) {
    this._storeRef = store ? new WeakRef(store) : null;
  }

  // --- Read (store preferred, video fallback) ---

  get paused() {
    return (this.store ?? this.video).paused;
  }
  get currentTime() {
    return (this.store ?? this.video).currentTime;
  }
  get duration() {
    return (this.store ?? this.video).duration;
  }
  get volume() {
    return (this.store ?? this.video).volume;
  }
  get muted() {
    return (this.store ?? this.video).muted;
  }
  get playbackRate() {
    return (this.store ?? this.video).playbackRate;
  }
  get error() {
    return (this.store ?? this.video).error;
  }

  get bufferEnd(): number {
    const store = this.store;
    if (store) {
      const ranges = store.buffered;
      return ranges.length > 0 ? ranges[ranges.length - 1]![1] : 0;
    }
    const ranges = this.video.buffered;
    return ranges.length > 0 ? ranges.end(ranges.length - 1) : 0;
  }

  // --- Write (route to store or video) ---

  play() {
    return (this.store ?? this.video).play();
  }

  pause() {
    (this.store ?? this.video).pause();
  }

  seek(time: number) {
    this.store ? this.store.seek(time) : (this.video.currentTime = time);
  }

  setVolume(v: number) {
    this.store ? this.store.setVolume(v) : (this.video.volume = v);
  }

  setPlaybackRate(v: number) {
    this.store ? this.store.setPlaybackRate(v) : (this.video.playbackRate = v);
  }

  loadSource(src: string) {
    this.store ? this.store.loadSource(src) : (this.video.src = src);
  }
}
