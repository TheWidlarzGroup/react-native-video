import type { ListenerSubscription } from '../types/EventEmitter';
import type { WebMediaProxy } from './WebMediaProxy';
import {
  attachPlaybackListeners,
  attachMediaInfoListeners,
  attachTrackListeners,
} from './webDOMEvents';

/**
 * Generic string-based event emitter for web.
 * DOM event bridging is handled by webDOMEvents.ts.
 */
export class WebEventEmitter {
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _cleanup: (() => void) | null = null;
  private _isBuffering = false;

  constructor(private _media: WebMediaProxy) {
    this._bindDOMEvents();
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

  /** @internal Used by VideoView for view-level events. */
  __emit(event: string, ...args: any[]) {
    this._emit(event, ...args);
  }

  /** @internal Used by VideoView for view-level events. */
  __addListener(
    event: string,
    listener: (...args: any[]) => void
  ): ListenerSubscription {
    return this.addListener(event, listener);
  }

  private _emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach((fn) => fn(...args));
  }

  private _bindDOMEvents() {
    const video = this._media.video;
    const media = this._media;
    const emit = this._emit.bind(this);

    const cleanups = [
      ...attachPlaybackListeners(
        video,
        media,
        emit,
        () => this._isBuffering,
        (v) => {
          this._isBuffering = v;
        }
      ),
      ...attachMediaInfoListeners(video, media, emit),
      ...attachTrackListeners(video, emit),
    ];

    this._cleanup = () => cleanups.forEach((fn) => fn());
  }
}
