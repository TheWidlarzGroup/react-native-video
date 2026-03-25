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
 * v10 store interface — the subset we use for event bridging.
 * Avoids importing v10 types directly to keep this file framework-agnostic.
 */
interface VideoStore {
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
  subscribe(callback: () => void): () => void;
}

export type { VideoStore };

export class WebEventEmitter implements VideoPlayerEventEmitterBase {
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _unsubscribe: (() => void) | null = null;
  private store: VideoStore | null = null;
  private _prevState = {
    paused: true,
    waiting: false,
    ended: false,
    seeking: false,
    canPlay: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    source: null as string | null,
    error: null as { code: number; message: string } | null,
  };

  constructor(
    store: VideoStore | null,
    private getMedia: () => HTMLVideoElement | null,
  ) {
    if (store) this.setStore(store);
  }

  /**
   * Connect or disconnect the v10 store.
   * Called by VideoPlayer.__setStore() when VideoView mounts/unmounts.
   */
  setStore(store: VideoStore | null) {
    this._unsubscribe?.();
    this._unsubscribe = null;
    this.store = store;

    if (store) {
      this._prevState = {
        paused: store.paused,
        waiting: store.waiting,
        ended: store.ended,
        seeking: store.seeking,
        canPlay: store.canPlay,
        currentTime: store.currentTime,
        duration: store.duration,
        volume: store.volume,
        muted: store.muted,
        playbackRate: store.playbackRate,
        source: store.source,
        error: store.error,
      };
      this._unsubscribe = store.subscribe(() => this._onStateChange());
    }
  }

  destroy() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  private _onStateChange() {
    const s = this.store;
    if (!s) return;
    const prev = this._prevState;

    // Playback state (play/pause)
    if (s.paused !== prev.paused) {
      this._emit("onPlaybackStateChange", {
        isPlaying: !s.paused,
        isBuffering: s.waiting,
      });
    }

    // Buffering
    if (s.waiting !== prev.waiting) {
      this._emit("onBuffer", s.waiting);
      this._emit("onStatusChange", s.waiting ? "loading" : "readyToPlay");
    }

    // Progress (currentTime changed)
    if (s.currentTime !== prev.currentTime) {
      const lastBuffered = s.buffered.length > 0
        ? s.buffered[s.buffered.length - 1]![1]
        : 0;
      this._emit("onProgress", {
        currentTime: s.currentTime,
        bufferDuration: lastBuffered,
      });
    }

    // Duration changed → onLoad
    if (s.duration !== prev.duration && s.duration > 0) {
      const media = this.getMedia();
      this._emit("onLoad", {
        currentTime: s.currentTime,
        duration: s.duration,
        width: media?.videoWidth ?? NaN,
        height: media?.videoHeight ?? NaN,
        orientation: "unknown",
      });
    }

    // Can play → ready
    if (s.canPlay && !prev.canPlay) {
      this._emit("onStatusChange", "readyToPlay");
      this._emit("onReadyToDisplay");
    }

    // Error
    if (s.error && !prev.error) {
      this._emit("onStatusChange", "error");
      const codeMap: Record<number, LibraryError | PlayerError | SourceError | UnknownError> = {
        1: "player/asset-not-initialized",
        2: "player/network",
        3: "player/invalid-source",
        4: "source/unsupported-content-type",
      };
      this._emit(
        "onError",
        new VideoError(codeMap[s.error.code] ?? "unknown/unknown", s.error.message),
      );
    }

    // Ended
    if (s.ended && !prev.ended) {
      this._emit("onEnd");
      this._emit("onStatusChange", "idle");
    }

    // Playback rate
    if (s.playbackRate !== prev.playbackRate) {
      this._emit("onPlaybackRateChange", s.playbackRate);
    }

    // Volume / muted
    if (s.volume !== prev.volume || s.muted !== prev.muted) {
      this._emit("onVolumeChange", {
        volume: s.volume,
        muted: s.muted,
      });
    }

    // Seek completed
    if (!s.seeking && prev.seeking) {
      this._emit("onSeek", s.currentTime);
    }

    // Source changed → onLoadStart
    if (s.source !== prev.source && s.source) {
      const media = this.getMedia();
      this._emit("onLoadStart", {
        sourceType: "network",
        source: {
          uri: s.source,
          config: {
            uri: s.source,
            externalSubtitles: [],
          },
          getAssetInformationAsync: async () => ({
            duration: s.duration,
            width: media?.videoWidth ?? NaN,
            height: media?.videoHeight ?? NaN,
            orientation: "unknown",
            bitrate: NaN,
            fileSize: -1n,
            isHDR: false,
            isLive: false,
          }),
        },
      });
    }

    // Text track changes
    const currentTrack = s.textTrackList.find(
      (t) => t.mode === "showing" && (t.kind === "subtitles" || t.kind === "captions"),
    );
    // Simple comparison — emit on every state change that includes textTrackList
    // This is acceptable since _emit only notifies if listeners exist
    if (currentTrack) {
      this._emit("onTrackChange", {
        id: currentTrack.label,
        label: currentTrack.label,
        language: currentTrack.language,
        selected: true,
      });
    }

    // Update prev state
    this._prevState = {
      paused: s.paused,
      waiting: s.waiting,
      ended: s.ended,
      seeking: s.seeking,
      canPlay: s.canPlay,
      currentTime: s.currentTime,
      duration: s.duration,
      volume: s.volume,
      muted: s.muted,
      playbackRate: s.playbackRate,
      source: s.source,
      error: s.error,
    };
  }

  // --- Listener infrastructure (unchanged) ---

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
