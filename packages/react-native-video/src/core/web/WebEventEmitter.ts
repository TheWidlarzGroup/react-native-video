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
import type { AudioTrack } from "../types/AudioTrack";
import type { VideoTrack } from "../types/VideoTrack";
import type { QualityLevel } from "../types/QualityLevel";
import type {
  ListenerSubscription,
  VideoPlayerEventEmitterBase,
} from "../types/EventEmitter";
import type { VideoJsPlayer } from "./WebVideoJsTypes";
import { attachTrackHandlers } from "./WebTrackHandler";

export class WebEventEmitter implements VideoPlayerEventEmitterBase {
  private _isBuffering = false;
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private detachTracks: () => void;

  constructor(private player: VideoJsPlayer) {
    // TODO: add `onBandwidthUpdate`

    // on buffer
    this._onCanPlay = this._onCanPlay.bind(this);
    this._onWaiting = this._onWaiting.bind(this);
    this.player.on("canplay", this._onCanPlay);
    this.player.on("waiting", this._onWaiting);

    // on end
    this._onEnded = this._onEnded.bind(this);
    this.player.on("ended", this._onEnded);

    // on load
    this._onDurationChange = this._onDurationChange.bind(this);
    this.player.on("durationchange", this._onDurationChange);

    // on load start
    this._onLoadStart = this._onLoadStart.bind(this);
    this.player.on("loadstart", this._onLoadStart);

    // on playback state change
    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this.player.on("play", this._onPlay);
    this.player.on("pause", this._onPause);

    // on playback rate change
    this._onRateChange = this._onRateChange.bind(this);
    this.player.on("ratechange", this._onRateChange);

    // on progress
    this._onTimeUpdate = this._onTimeUpdate.bind(this);
    this.player.on("timeupdate", this._onTimeUpdate);

    // on ready to play
    this._onLoadedData = this._onLoadedData.bind(this);
    this.player.on("loadeddata", this._onLoadedData);

    // on seek
    this._onSeeked = this._onSeeked.bind(this);
    this.player.on("seeked", this._onSeeked);

    // on volume change
    this._onVolumeChange = this._onVolumeChange.bind(this);
    this.player.on("volumechange", this._onVolumeChange);

    // on status change
    this._onError = this._onError.bind(this);
    this.player.on("error", this._onError);

    this.detachTracks = attachTrackHandlers(player, this._emit.bind(this));
  }

  destroy() {
    this.player.off("canplay", this._onCanPlay);
    this.player.off("waiting", this._onWaiting);

    this.player.off("ended", this._onEnded);

    this.player.off("durationchange", this._onDurationChange);

    this.player.off("loadstart", this._onLoadStart);

    this.player.off("play", this._onPlay);
    this.player.off("pause", this._onPause);

    this.player.off("ratechange", this._onRateChange);

    this.player.off("timeupdate", this._onTimeUpdate);

    this.player.off("loadeddata", this._onLoadedData);

    this.player.off("seeked", this._onSeeked);

    this.player.off("volumechange", this._onVolumeChange);

    this.player.off("error", this._onError);

    this.detachTracks();
  }

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

  addOnAudioTrackChangeListener(
    listener: (track: AudioTrack | null) => void,
  ): ListenerSubscription {
    return this._addListener("onAudioTrackChange", listener);
  }

  addOnVideoTrackChangeListener(
    listener: (track: VideoTrack | null) => void,
  ): ListenerSubscription {
    return this._addListener("onVideoTrackChange", listener);
  }

  addOnQualityChangeListener(
    listener: (quality: QualityLevel) => void,
  ): ListenerSubscription {
    return this._addListener("onQualityChange", listener);
  }

  private _onTimeUpdate() {
    this._emit("onProgress", {
      currentTime: this.player.currentTime() ?? 0,
      bufferDuration: this.player.bufferedEnd(),
    });
  }

  private _onCanPlay() {
    this._isBuffering = false;
    this._emit("onBuffer", false);
    this._emit("onStatusChange", "readyToPlay");
  }
  private _onWaiting() {
    this._isBuffering = true;
    this._emit("onBuffer", true);
    this._emit("onStatusChange", "loading");
  }

  private _onDurationChange() {
    this._emit("onLoad", {
      currentTime: this.player.currentTime() ?? 0,
      duration: this.player.duration() ?? NaN,
      width: this.player.videoWidth() ?? NaN,
      height: this.player.videoHeight() ?? NaN,
      orientation: "unknown",
    });
  }

  private _onEnded() {
    this._emit("onEnd");
    this._emit("onStatusChange", "idle");
  }

  private _onLoadStart() {
    this._emit("onLoadStart", {
      sourceType: "network",
      source: {
        uri: this.player.currentSrc(),
        config: {
          uri: this.player.currentSrc(),
          externalSubtitles: [],
        },
        getAssetInformationAsync: async () => {
          return {
            duration: this.player.duration() ?? NaN,
            height: this.player.videoHeight() ?? NaN,
            width: this.player.videoWidth() ?? NaN,
            orientation: "unknown",
            bitrate: NaN,
            fileSize: -1n,
            isHDR: false,
            isLive: false,
          };
        },
      },
    });
  }

  private _onPlay() {
    this._emit("onPlaybackStateChange", {
      isPlaying: true,
      isBuffering: this._isBuffering,
    });
  }

  private _onPause() {
    this._emit("onPlaybackStateChange", {
      isPlaying: false,
      isBuffering: this._isBuffering,
    });
  }

  private _onRateChange() {
    this._emit("onPlaybackRateChange", this.player.playbackRate() ?? 1);
  }

  private _onLoadedData() {
    this._emit("onReadyToDisplay");
  }

  private _onSeeked() {
    this._emit("onSeek", this.player.currentTime() ?? 0);
  }

  private _onVolumeChange() {
    this._emit("onVolumeChange", {
      muted: this.player.muted() ?? false,
      volume: this.player.volume() ?? 1,
    });
  }

  private _onError() {
    this._emit("onStatusChange", "error");
    const err = this.player.error();
    if (!err) {
      console.error("Unknown error occurred in player");
      return;
    }
    const codeMap = {
      // @ts-expect-error Code added to html5 MediaError by videojs
      [MediaError.MEDIA_ERR_CUSTOM]: "unknown/unknown",
      [MediaError.MEDIA_ERR_ABORTED]: "player/asset-not-initialized",
      [MediaError.MEDIA_ERR_NETWORK]: "player/network",
      [MediaError.MEDIA_ERR_DECODE]: "player/invalid-source",
      [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]:
        "source/unsupported-content-type",
      // @ts-expect-error Code added to html5 MediaError by videojs
      [MediaError.MEDIA_ERR_ENCRYPTED]: "source/failed-to-initialize-asset",
    } as Record<
      number,
      LibraryError | PlayerError | SourceError | UnknownError
    >;
    this._emit("onError", new VideoError(codeMap[err.code] ?? "unknown/unknown", err.message));
  }
}
