import type { ListenerSubscription } from '../types/EventEmitter';
import type { VideoPlayerSourceBase } from '../types/VideoPlayerSourceBase';
import type { KeplerMedia } from './KeplerMedia';
import { attachKeplerMediaEvents } from './keplerMediaEvents';

/**
 * String-based event emitter for Vega, like `WebEventEmitter`.
 */
export class KeplerEventEmitter {
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _cleanup: (() => void) | null = null;
  /** Set by the player right after construction. */
  getSource!: () => VideoPlayerSourceBase;

  constructor(media: KeplerMedia) {
    media.run(() => {
      const cleanups = attachKeplerMediaEvents(
        media,
        () => this.getSource(),
        this._emit.bind(this)
      );
      this._cleanup = () => cleanups.forEach((fn) => fn());
    });
  }

  destroy() {
    this._cleanup?.();
    this._cleanup = null;
  }

  addListener(
    event: string,
    listener: (...args: any[]) => void
  ): ListenerSubscription {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener);
    return {
      remove: () => {
        this._listeners.get(event)?.delete(listener);
      },
    };
  }

  clearAllListeners(): void {
    this._listeners.clear();
  }

  /** @internal Errors that do not come from w3cmedia. */
  __emit(event: string, ...args: any[]) {
    this._emit(event, ...args);
  }

  private _emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach((fn) => fn(...args));
  }
}
