import type videojs from "video.js";
import type {
  BandwidthData,
  onLoadData,
  onLoadStartData,
  onPlaybackStateChangeData,
  onProgressData,
  onVolumeChangeData,
  AllPlayerEvents as PlayerEvents,
  TimedMetadata,
} from "./types/Events";
import type { TextTrack } from "./types/TextTrack";
import type { VideoRuntimeError } from "./types/VideoError";
import type { VideoPlayerStatus } from "./types/VideoPlayerStatus";

type VideoJsPlayer = ReturnType<typeof videojs>;

export class WebEventEmiter implements PlayerEvents {
  private _isBuferring = false;

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
  }

  _onTimeUpdate() {
    this.onProgress({
      currentTime: this.player.currentTime() ?? 0,
      bufferDuration: this.player.bufferedEnd(),
    });
  }

  _onCanPlay() {
    this._isBuferring = false;
    this.onBuffer(false);
    this.onStatusChange("readyToPlay");
  }
  _onWaiting() {
    this._isBuferring = true;
    this.onBuffer(true);
    this.onStatusChange("loading");
  }

  _onDurationChange() {
    this.onLoad({
      currentTime: this.player.currentTime() ?? 0,
      duration: this.player.duration() ?? NaN,
      width: this.player.width() ?? NaN,
      height: this.player.height() ?? NaN,
      orientation: "unknown",
    });
  }

  _onEnded() {
    this.onEnd();
    this.onStatusChange("idle");
  }

  _onLoadStart() {
    this.onLoadStart({
      sourceType: "network",
      source: {
        uri: this.player.src(undefined)!,
        config: {
          uri: this.player.src(undefined)!,
          externalSubtitles: [],
        },
        getAssetInformationAsync: async () => {
          return {
            duration: BigInt(this.player.duration() ?? NaN),
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
    this.onPlaybackStateChange({
      isPlaying: true,
      isBuffering: this._isBuferring,
    });
  }

  _onPause() {
    this.onPlaybackStateChange({
      isPlaying: false,
      isBuffering: this._isBuferring,
    });
  }

  _onRateChange() {
    this.onPlaybackRateChange(this.player.playbackRate() ?? 1);
  }

  _onLoadedData() {
    this.onReadyToDisplay();
  }

  _onSeeked() {
    this.onSeek(this.player.currentTime() ?? 0);
  }

  _onVolumeChange() {
    this.onVolumeChange({
      muted: this.player.muted() ?? false,
      volume: this.player.volume() ?? 1,
    });
  }

  _onError() {
    this.onStatusChange("error");
  }

  NOOP = () => {};

  onError: (error: VideoRuntimeError) => void = this.NOOP;
  onAudioBecomingNoisy: () => void = this.NOOP;
  onAudioFocusChange: (hasAudioFocus: boolean) => void = this.NOOP;
  onBandwidthUpdate: (data: BandwidthData) => void = this.NOOP;
  onBuffer: (buffering: boolean) => void = this.NOOP;
  onControlsVisibleChange: (visible: boolean) => void = this.NOOP;
  onEnd: () => void = this.NOOP;
  onExternalPlaybackChange: (externalPlaybackActive: boolean) => void =
    this.NOOP;
  onLoad: (data: onLoadData) => void = this.NOOP;
  onLoadStart: (data: onLoadStartData) => void = this.NOOP;
  onPlaybackStateChange: (data: onPlaybackStateChangeData) => void = this.NOOP;
  onPlaybackRateChange: (rate: number) => void = this.NOOP;
  onProgress: (data: onProgressData) => void = this.NOOP;
  onReadyToDisplay: () => void = this.NOOP;
  onSeek: (seekTime: number) => void = this.NOOP;
  onTimedMetadata: (metadata: TimedMetadata) => void = this.NOOP;
  onTextTrackDataChanged: (texts: string[]) => void = this.NOOP;
  onTrackChange: (track: TextTrack | null) => void = this.NOOP;
  onVolumeChange: (data: onVolumeChangeData) => void = this.NOOP;
  onStatusChange: (status: VideoPlayerStatus) => void = this.NOOP;
}
