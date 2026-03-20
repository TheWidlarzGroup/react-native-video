import type videojs from "video.js";
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
import type { VideoJsTracks, VideoJsQualityArray } from "../VideoPlayer.web";
import type { VideoTrack } from "../types/VideoTrack";
import type { QualityLevel } from "../types/QualityLevel";
import type {
  ListenerSubscription,
  VideoPlayerEventEmitterBase,
} from "../types/EventEmitter";

type VideoJsPlayer = ReturnType<typeof videojs>;

export class WebEventEmiter implements VideoPlayerEventEmitterBase {
  private _isBuferring = false;
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(private player: VideoJsPlayer) {
    // TODO: add `onBandwithUpdate`

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

    this._onTextTrackChange = this._onTextTrackChange.bind(this);
    this.player.textTracks().on("change", this._onTextTrackChange);

    this._onAudioTrackChange = this._onAudioTrackChange.bind(this);
    this.player.audioTracks().on("change", this._onAudioTrackChange);

    this._onVideoTrackChange = this._onVideoTrackChange.bind(this);
    this.player.videoTracks().on("change", this._onVideoTrackChange);

    this._onQualityChange = this._onQualityChange.bind(this);
    // @ts-expect-error this isn't typed
    this.player.qualityLevels().on("change", this._onQualityChange);
  }

  destroy() {
    this.player.off("canplay", this._onCanPlay);
    this.player.off("waiting", this._onWaiting);

    this.player.off("ended", this._onEnded);

    this.player.off("durationchange", this._onDurationChange);

    this.player.off("play", this._onPlay);
    this.player.off("pause", this._onPause);

    this.player.off("ratechange", this._onRateChange);

    this.player.off("timeupdate", this._onTimeUpdate);

    this.player.off("loadeddata", this._onLoadedData);

    this.player.off("seeked", this._onSeeked);

    this.player.off("volumechange", this._onVolumeChange);

    this.player.off("error", this._onError);

    this.player.textTracks().off("change", this._onTextTrackChange);

    this.player.audioTracks().off("change", this._onAudioTrackChange);

    this.player.videoTracks().off("change", this._onVideoTrackChange);

    this._onQualityChange = this._onQualityChange.bind(this);
    // @ts-expect-error this isn't typed
    this.player.qualityLevels().off("change", this._onQualityChange);
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

  _onTimeUpdate() {
    this._emit("onProgress", {
      currentTime: this.player.currentTime() ?? 0,
      bufferDuration: this.player.bufferedEnd(),
    });
  }

  _onCanPlay() {
    this._isBuferring = false;
    this._emit("onBuffer", false);
    this._emit("onStatusChange", "readyToPlay");
  }
  _onWaiting() {
    this._isBuferring = true;
    this._emit("onBuffer", true);
    this._emit("onStatusChange", "loading");
  }

  _onDurationChange() {
    this._emit("onLoad", {
      currentTime: this.player.currentTime() ?? 0,
      duration: this.player.duration() ?? NaN,
      width: this.player.width() ?? NaN,
      height: this.player.height() ?? NaN,
      orientation: "unknown",
    });
  }

  _onEnded() {
    this._emit("onEnd");
    this._emit("onStatusChange", "idle");
  }

  _onLoadStart() {
    this._emit("onLoadStart", {
      sourceType: "network",
      source: {
        uri: this.player.src(undefined)!,
        config: {
          uri: this.player.src(undefined)!,
          externalSubtitles: [],
        },
        getAssetInformationAsync: async () => {
          return {
            duration: this.player.duration() ?? NaN,
            height: this.player.height() ?? NaN,
            width: this.player.width() ?? NaN,
            orientation: "unknown",
            bitrate: NaN,
            fileSize: BigInt(NaN),
            isHDR: false,
            isLive: false,
          };
        },
      },
    });
  }

  _onPlay() {
    this._emit("onPlaybackStateChange", {
      isPlaying: true,
      isBuffering: this._isBuferring,
    });
  }

  _onPause() {
    this._emit("onPlaybackStateChange", {
      isPlaying: false,
      isBuffering: this._isBuferring,
    });
  }

  _onRateChange() {
    this._emit("onPlaybackRateChange", this.player.playbackRate() ?? 1);
  }

  _onLoadedData() {
    this._emit("onReadyToDisplay");
  }

  _onSeeked() {
    this._emit("onSeek", this.player.currentTime() ?? 0);
  }

  _onVolumeChange() {
    this._emit("onVolumeChange", {
      muted: this.player.muted() ?? false,
      volume: this.player.volume() ?? 1,
    });
  }

  _onError() {
    this._emit("onStatusChange", "error");
    const err = this.player.error();
    if (!err) {
      console.error("Unknown error occured in player");
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
    this._emit("onError", new VideoError(codeMap[err.code]!, err.message));
  }

  _onTextTrackChange() {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTextTracks = this.player.textTracks();
    const selected = [...Array(tracks.length)]
      .map((_, i) => ({
        id: tracks[i]!.id,
        label: tracks[i]!.label,
        language: tracks[i]!.language,
        selected: tracks[i]!.mode === "showing",
      }))
      .find((x) => x.selected);

    this._emit("onTrackChange", selected ?? null);
  }

  _onAudioTrackChange() {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.audioTracks();
    const selected = [...Array(tracks.length)]
      .map((_, i) => ({
        id: tracks[i]!.id,
        label: tracks[i]!.label,
        language: tracks[i]!.language,
        selected: tracks[i]!.enabled,
      }))
      .find((x) => x.selected);

    this._emit("onAudioTrackChange", selected ?? null);
  }

  _onVideoTrackChange() {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.videoTracks();
    const selected = [...Array(tracks.length)]
      .map((_, i) => ({
        id: tracks[i]!.id,
        label: tracks[i]!.label,
        language: tracks[i]!.language,
        selected: tracks[i]!.enabled,
      }))
      .find((x) => x.selected);

    this._emit("onVideoTrackChange", selected ?? null);
  }

  _onQualityChange() {
    // @ts-expect-error this isn't typed
    const levels: VideoJsQualityArray = this.player.qualityLevels();
    const quality = levels[levels.selectedIndex]!;

    this._emit("onQualityChange", {
      id: quality.id,
      width: quality.width,
      height: quality.height,
      bitrate: quality.bitrate,
      selected: true,
    });
  }
}
