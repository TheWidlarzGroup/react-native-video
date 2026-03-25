import videojs from "video.js";
import type { AudioTrack } from "./types/AudioTrack";
import type { IgnoreSilentSwitchMode } from "./types/IgnoreSilentSwitchMode";
import type { MixAudioMode } from "./types/MixAudioMode";
import type { TextTrack } from "./types/TextTrack";
import type { NoAutocomplete } from "./types/Utils";
import type {
  NativeVideoConfig,
  VideoConfig,
  VideoSource,
} from "./types/VideoConfig";
import type { VideoPlayerBase } from "./types/VideoPlayerBase";
import type { VideoPlayerSourceBase } from "./types/VideoPlayerSourceBase";
import type { VideoPlayerStatus } from "./types/VideoPlayerStatus";
import { VideoPlayerEvents } from "./VideoPlayerEvents";
import { MediaSessionHandler } from "./web/MediaSession";
import { WebEventEmitter } from "./web/WebEventEmitter";
import type { VideoTrack } from "./types/VideoTrack";
import type { QualityLevel } from "./types/QualityLevel";
import type { SupportedFeatures } from "./types/SupportedFeatures";
import {
  mapVideoJsTracks,
  type VideoJsPlayer,
  type VideoJsTextTracks,
  type VideoJsTracks,
  type VideoJsQualityArray,
} from "./web/WebVideoJsTypes";

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  protected video: HTMLVideoElement;
  public player: VideoJsPlayer;
  private mediaSession: MediaSessionHandler;
  private _source: NativeVideoConfig | undefined;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSourceBase) {
    const video = document.createElement("video");
    const player = videojs(video, {
      qualityLevels: true,
      html5: {
        preloadTextTracks: false,
        nativeTextTracks: true,
      },
    });
    super(new WebEventEmitter(player));

    this.video = video;
    this.player = player;
    this.mediaSession = new MediaSessionHandler(this.player);

    // Bridge web errors to JS event system so consumers receive them via addEventListener.
    (this.eventEmitter as WebEventEmitter).addOnErrorListener((error) => {
      this.triggerJSEvent("onError", error);
    });

    this.replaceSourceAsync(source);
  }

  /**
   * Cleans up player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * @internal
   */
  __destroy() {
    this.mediaSession.disable();
    (this.eventEmitter as WebEventEmitter).destroy();
    this.clearAllEvents();
    this.player.dispose();
  }

  __getNativeRef() {
    return this.video;
  }

  // Source
  get source(): VideoPlayerSourceBase {
    return {
      uri: this._source!.uri,
      config: this._source!,
      getAssetInformationAsync: async () => {
        return {
          bitrate: NaN,
          width: this.player.videoWidth(),
          height: this.player.videoHeight(),
          duration: this.duration,
          fileSize: -1n,
          isHDR: false,
          isLive: false,
          orientation: "landscape",
        };
      },
    };
  }

  // Status
  get status(): VideoPlayerStatus {
    if (this.video.error) return "error";
    if (this.video.readyState === HTMLMediaElement.HAVE_NOTHING) return "idle";
    if (
      this.video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA ||
      this.video.readyState === HTMLMediaElement.HAVE_FUTURE_DATA
    )
      return "readyToPlay";
    return "loading";
  }

  // Duration
  get duration(): number {
    return this.player.duration() ?? NaN;
  }

  // Volume
  get volume(): number {
    return this.player.volume() ?? 1;
  }

  set volume(value: number) {
    this.player.volume(value);
  }

  // Current Time
  get currentTime(): number {
    return this.player.currentTime() ?? NaN;
  }

  set currentTime(value: number) {
    this.player.currentTime(value);
  }

  // Muted
  get muted(): boolean {
    return this.player.muted() ?? false;
  }

  set muted(value: boolean) {
    this.player.muted(value);
  }

  // Loop
  get loop(): boolean {
    return this.player.loop() ?? false;
  }

  set loop(value: boolean) {
    this.player.loop(value);
  }

  // Rate
  get rate(): number {
    return this.player.playbackRate() ?? 1;
  }

  set rate(value: number) {
    this.player.playbackRate(value);
  }

  // Mix Audio Mode
  get mixAudioMode(): MixAudioMode {
    return "auto";
  }

  set mixAudioMode(_: MixAudioMode) {}

  // Ignore Silent Switch Mode
  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode {
    return "auto";
  }

  set ignoreSilentSwitchMode(_: IgnoreSilentSwitchMode) {}

  // Play In Background
  get playInBackground(): boolean {
    return true;
  }

  set playInBackground(_: boolean) {}

  // Play When Inactive
  get playWhenInactive(): boolean {
    return true;
  }

  set playWhenInactive(_: boolean) {}

  get isPlaying(): boolean {
    return !this.player.paused();
  }

  get showNotificationControls(): boolean {
    return this.mediaSession.enabled;
  }

  set showNotificationControls(value: boolean) {
    if (!value) {
      this.mediaSession.disable();
      return;
    }
    this.mediaSession.enable();
    this.mediaSession.updateMediaSession(this._source?.metadata);
  }

  async initialize(): Promise<void> {
    // noop on web
  }

  async preload(): Promise<void> {
    this.player.load();
  }

  /**
   * Releases the player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * Accessing any properties or methods of the player after calling this method will throw an error.
   * If you want to clean player resource use `replaceSourceAsync` with `null` instead.
   */
  release(): void {
    this.__destroy();
  }

  play(): void {
    // error are already handled by the `onError` callback, no need to catch it here.
    this.player.play()?.catch();
  }

  pause(): void {
    this.player.pause();
  }

  seekBy(time: number): void {
    const now = this.player.currentTime() ?? 0;
    this.player.currentTime(now + time);
  }

  seekTo(time: number): void {
    this.player.currentTime(time);
  }

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSourceBase>
      | null,
  ): Promise<void> {
    if (!source) {
      this.player.src([]);
      this.player.reset();
      return;
    }

    if (typeof source === "string") {
      source = { uri: source };
    }

    if (typeof source === "number" || typeof source.uri === "number") {
      console.error(
        "A source uri must be a string. Numbers are only supported on native.",
      );
      return;
    }
    this._source = source as NativeVideoConfig;
    // TODO: handle start time
    this.player.src({
      src: source.uri,
      type: source.mimeType,
    });
    if (this.mediaSession.enabled)
      this.mediaSession.updateMediaSession(source.metadata);

    for (const sub of source.externalSubtitles ?? []) {
      this.player.addRemoteTextTrack({
        id: sub.uri,
        kind: "subtitles",
        label: sub.label,
        src: sub.uri,
        srclang: sub.language,
      });
    }

    if (source.initializeOnCreation) await this.preload();
  }

  // Text Track Management

  getAvailableTextTracks(): TextTrack[] {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTextTracks = this.player.textTracks();

    return mapVideoJsTracks(tracks, (track) => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.mode === "showing",
    }));
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTextTracks = this.player.textTracks();

    for (let i = 0; i < tracks.length; i++) {
      tracks[i]!.mode =
        tracks[i]!.id === textTrack?.id ? "showing" : "disabled";
    }
  }

  // Selected Text Track
  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }

  // audio tracks

  getAvailableAudioTracks(): AudioTrack[] {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.audioTracks();

    return mapVideoJsTracks(tracks, (track) => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.enabled,
    }));
  }

  selectAudioTrack(track: AudioTrack | null): void {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.audioTracks();

    for (let i = 0; i < tracks.length; i++) {
      tracks[i]!.enabled = tracks[i]!.id === track?.id;
    }
  }

  get selectedAudioTrack(): AudioTrack | undefined {
    return this.getAvailableAudioTracks().find((x) => x.selected);
  }

  // video tracks

  getAvailableVideoTracks(): VideoTrack[] {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.videoTracks();

    return mapVideoJsTracks(tracks, (track) => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.enabled,
    }));
  }

  selectVideoTrack(track: VideoTrack | null): void {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTracks = this.player.videoTracks();

    for (let i = 0; i < tracks.length; i++) {
      tracks[i]!.enabled = tracks[i]!.id === track?.id;
    }
  }

  get selectedVideoTrack(): VideoTrack | undefined {
    return this.getAvailableVideoTracks().find((x) => x.selected);
  }

  // quality

  getAvailableQualities(): QualityLevel[] {
    // @ts-expect-error this isn't typed
    const levels: VideoJsQualityArray = this.player.qualityLevels();
    return mapVideoJsTracks(levels, (level, i) => ({
      id: level.id,
      width: level.width,
      height: level.height,
      bitrate: level.bitrate,
      selected: levels.selectedIndex === i,
    }));
  }

  selectQuality(quality: QualityLevel | null): void {
    // @ts-expect-error this isn't typed
    const levels: VideoJsQualityArray = this.player.qualityLevels();

    for (let i = 0; i < levels.length; i++) {
      // if quality is null, enable back auto-quality switch (so enable all lvls)
      levels[i]!.enabled = !quality || levels[i]!.id === quality.id;
    }
  }

  get currentQuality(): QualityLevel | undefined {
    return this.getAvailableQualities().find((x) => x.selected);
  }
  get autoQualityEnabled(): boolean {
    // @ts-expect-error this isn't typed
    const levels: VideoJsQualityArray = this.player.qualityLevels();
    // if we have a quality disabled that means we manually disabled it & disabled auto quality
    for (let i = 0; i < levels.length; i++) {
      if (!levels[i]!.enabled) return false;
    }
    return true;
  }

  get supportedFeatures(): SupportedFeatures {
    return {
      audioTrackSelection: true,
      videoTrackSelection: true,
      qualitySelection: true,
    };
  }
}

export { VideoPlayer };
