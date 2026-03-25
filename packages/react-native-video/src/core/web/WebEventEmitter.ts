import type {
  BandwidthData,
  onLoadData,
  onLoadStartData,
  onPlaybackStateChangeData,
  onProgressData,
  onVolumeChangeData,
  TimedMetadata,
} from "../types/Events";
import type { TextTrack } from "../types/TextTrack";
import {
  type LibraryError,
  type PlayerError,
  type SourceError,
  type UnknownError,
  VideoError,
  type VideoRuntimeError,
} from "../types/VideoError";
import type { VideoPlayerStatus } from "../types/VideoPlayerStatus";
import type {
  ListenerSubscription,
  VideoPlayerEventEmitterBase,
} from "../types/EventEmitter";

/**
 * video.js store interface — optional, used for enhanced buffering info when available.
 */
export interface VideoStore {
  readonly paused: boolean;
  readonly ended: boolean;
  readonly waiting: boolean;
  readonly seeking: boolean;
  readonly canPlay: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly volume: number;
  readonly muted: boolean;
  readonly playbackRate: number;
  readonly source: string | null;
  readonly buffered: [number, number][];
  readonly error: { code: number; message: string } | null;
  readonly textTrackList: Array<{ kind: string; label: string; language: string; mode: string }>;
  readonly destroyed: boolean;
  readonly target: unknown;
  subscribe(callback: () => void): () => void;
  attach(target: { media: HTMLVideoElement; container: HTMLElement | null }): () => void;
  destroy(): void;
  loadSource(src: string): string;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): Promise<number>;
  setVolume(volume: number): number;
  setPlaybackRate(rate: number): void;
  requestFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  requestPictureInPicture(): Promise<void>;
  exitPictureInPicture(): Promise<void>;
  readonly pipAvailability: string;
}

/**
 * WebEventEmitter bridges HTML5 media events to our event system.
 * Works with or without a video.js store — video element events are the primary source.
 * When a video.js store is connected, it provides enhanced buffering info.
 */
export class WebEventEmitter implements VideoPlayerEventEmitterBase {
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _mediaCleanup: (() => void) | null = null;
  private _storeUnsubscribe: (() => void) | null = null;
  private _store: VideoStore | null = null;
  private _isBuffering = false;

  constructor(
    store: VideoStore | null,
    private getMedia: () => HTMLVideoElement | null,
  ) {
    // Attach to video element immediately if available
    this._attachMediaListeners();
    if (store) this.setStore(store);
  }

  /**
   * Connect or disconnect the video.js store (optional enhancement).
   */
  setStore(store: VideoStore | null) {
    this._storeUnsubscribe?.();
    this._storeUnsubscribe = null;
    this._store = store;
  }

  destroy() {
    this._storeUnsubscribe?.();
    this._storeUnsubscribe = null;
    this._mediaCleanup?.();
    this._mediaCleanup = null;
  }

  private _attachMediaListeners() {
    const video = this.getMedia();
    if (!video) return;

    const on = (event: string, handler: () => void) => {
      video.addEventListener(event, handler);
      return () => video.removeEventListener(event, handler);
    };

    const cleanups: Array<() => void> = [];

    cleanups.push(on("play", () => {
      this._emit("onPlaybackStateChange", {
        isPlaying: true,
        isBuffering: this._isBuffering,
      });
    }));

    cleanups.push(on("pause", () => {
      this._emit("onPlaybackStateChange", {
        isPlaying: false,
        isBuffering: this._isBuffering,
      });
    }));

    cleanups.push(on("waiting", () => {
      this._isBuffering = true;
      this._emit("onBuffer", true);
      this._emit("onStatusChange", "loading");
    }));

    cleanups.push(on("canplay", () => {
      this._isBuffering = false;
      this._emit("onBuffer", false);
      this._emit("onStatusChange", "readyToPlay");
    }));

    cleanups.push(on("timeupdate", () => {
      const buffered = video.buffered;
      const lastBuffered = buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
      this._emit("onProgress", {
        currentTime: video.currentTime,
        bufferDuration: lastBuffered,
      });
    }));

    cleanups.push(on("durationchange", () => {
      if (video.duration > 0) {
        this._emit("onLoad", {
          currentTime: video.currentTime,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          orientation: "unknown",
        });
      }
    }));

    cleanups.push(on("ended", () => {
      this._emit("onEnd");
      this._emit("onStatusChange", "idle");
    }));

    cleanups.push(on("ratechange", () => {
      this._emit("onPlaybackRateChange", video.playbackRate);
    }));

    cleanups.push(on("loadeddata", () => {
      this._emit("onReadyToDisplay");
    }));

    cleanups.push(on("seeked", () => {
      this._emit("onSeek", video.currentTime);
    }));

    cleanups.push(on("volumechange", () => {
      this._emit("onVolumeChange", {
        volume: video.volume,
        muted: video.muted,
      });
    }));

    cleanups.push(on("loadstart", () => {
      this._emit("onLoadStart", {
        sourceType: "network",
        source: {
          uri: video.currentSrc || video.src,
          config: {
            uri: video.currentSrc || video.src,
            externalSubtitles: [],
          },
          getAssetInformationAsync: async () => ({
            duration: video.duration || NaN,
            width: video.videoWidth,
            height: video.videoHeight,
            orientation: "unknown",
            bitrate: NaN,
            fileSize: -1n,
            isHDR: false,
            isLive: false,
          }),
        },
      });
    }));

    cleanups.push(on("error", () => {
      this._emit("onStatusChange", "error");
      const err = video.error;
      if (!err) {
        console.error("Unknown error occurred in player");
        return;
      }
      const codeMap: Record<number, LibraryError | PlayerError | SourceError | UnknownError> = {
        1: "player/asset-not-initialized",
        2: "player/not-initialized",
        3: "player/invalid-source",
        4: "source/unsupported-content-type",
      };
      this._emit("onError", new VideoError(codeMap[err.code] ?? "unknown/unknown", err.message));
    }));

    this._mediaCleanup = () => { cleanups.forEach((fn) => fn()); };
  }

  // --- Listener infrastructure ---

  private _addListener(
    event: string,
    listener: (...args: any[]) => void,
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

  private _emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach((fn) => fn(...args));
  }

  // --- Listener registration (implements VideoPlayerEventEmitterBase) ---

  addOnAudioBecomingNoisyListener(listener: () => void): ListenerSubscription {
    return this._addListener("onAudioBecomingNoisy", listener);
  }

  addOnAudioFocusChangeListener(
    listener: (hasAudioFocus: boolean) => void,
  ): ListenerSubscription {
    return this._addListener("onAudioFocusChange", listener);
  }

  addOnBandwidthUpdateListener(
    listener: (data: BandwidthData) => void,
  ): ListenerSubscription {
    return this._addListener("onBandwidthUpdate", listener);
  }

  addOnBufferListener(
    listener: (buffering: boolean) => void,
  ): ListenerSubscription {
    return this._addListener("onBuffer", listener);
  }

  addOnControlsVisibleChangeListener(
    listener: (visible: boolean) => void,
  ): ListenerSubscription {
    return this._addListener("onControlsVisibleChange", listener);
  }

  addOnEndListener(listener: () => void): ListenerSubscription {
    return this._addListener("onEnd", listener);
  }

  addOnExternalPlaybackChangeListener(
    listener: (externalPlaybackActive: boolean) => void,
  ): ListenerSubscription {
    return this._addListener("onExternalPlaybackChange", listener);
  }

  addOnLoadListener(
    listener: (data: onLoadData) => void,
  ): ListenerSubscription {
    return this._addListener("onLoad", listener);
  }

  addOnLoadStartListener(
    listener: (data: onLoadStartData) => void,
  ): ListenerSubscription {
    return this._addListener("onLoadStart", listener);
  }

  addOnPlaybackStateChangeListener(
    listener: (data: onPlaybackStateChangeData) => void,
  ): ListenerSubscription {
    return this._addListener("onPlaybackStateChange", listener);
  }

  addOnPlaybackRateChangeListener(
    listener: (rate: number) => void,
  ): ListenerSubscription {
    return this._addListener("onPlaybackRateChange", listener);
  }

  addOnProgressListener(
    listener: (data: onProgressData) => void,
  ): ListenerSubscription {
    return this._addListener("onProgress", listener);
  }

  addOnReadyToDisplayListener(listener: () => void): ListenerSubscription {
    return this._addListener("onReadyToDisplay", listener);
  }

  addOnSeekListener(
    listener: (position: number) => void,
  ): ListenerSubscription {
    return this._addListener("onSeek", listener);
  }

  addOnStatusChangeListener(
    listener: (status: VideoPlayerStatus) => void,
  ): ListenerSubscription {
    return this._addListener("onStatusChange", listener);
  }

  addOnTimedMetadataListener(
    listener: (data: TimedMetadata) => void,
  ): ListenerSubscription {
    return this._addListener("onTimedMetadata", listener);
  }

  addOnTextTrackDataChangedListener(
    listener: (data: string[]) => void,
  ): ListenerSubscription {
    return this._addListener("onTextTrackDataChanged", listener);
  }

  addOnTrackChangeListener(
    listener: (track: TextTrack | null) => void,
  ): ListenerSubscription {
    return this._addListener("onTrackChange", listener);
  }

  addOnVolumeChangeListener(
    listener: (data: onVolumeChangeData) => void,
  ): ListenerSubscription {
    return this._addListener("onVolumeChange", listener);
  }

  clearAllListeners(): void {
    this._listeners.clear();
  }

  addOnErrorListener(
    listener: (error: VideoRuntimeError) => void,
  ): ListenerSubscription {
    return this._addListener("onError", listener);
  }
}
