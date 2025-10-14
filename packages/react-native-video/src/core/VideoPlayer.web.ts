import type { VideoPlayerSource } from "../spec/nitro/VideoPlayerSource.nitro";
import type { IgnoreSilentSwitchMode } from "./types/IgnoreSilentSwitchMode";
import type { MixAudioMode } from "./types/MixAudioMode";
import type { TextTrack } from "./types/TextTrack";
import type { NoAutocomplete } from "./types/Utils";
import type { VideoConfig, VideoSource } from "./types/VideoConfig";
import {
  tryParseNativeVideoError,
  VideoRuntimeError,
} from "./types/VideoError";
import type { VideoPlayerBase } from "./types/VideoPlayerBase";
import type { VideoPlayerStatus } from "./types/VideoPlayerStatus";
import { VideoPlayerEvents } from "./VideoPlayerEvents";
import { MediaSessionHandler } from "./web/MediaSession";
import { WebEventEmiter } from "./web/WebEventEmiter";
import videojs from "video.js";

type VideoJsPlayer = ReturnType<typeof videojs>;

// declared https://github.com/videojs/video.js/blob/main/src/js/tracks/track-list.js#L58
type VideoJsTextTracks = {
  length: number;
  [i: number]: {
    // declared: https://github.com/videojs/video.js/blob/main/src/js/tracks/track.js
    id: string;
    label: string;
    language: string;
    // declared https://github.com/videojs/video.js/blob/20f8d76cd24325a97ccedf0b013cd1a90ad0bcd7/src/js/tracks/text-track.js
    default: boolean;
    mode: "showing" | "disabled" | "hidden";
  };
};

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  protected video: HTMLVideoElement;
  public player: VideoJsPlayer;
  private mediaSession: MediaSessionHandler;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSource) {
    const video = document.createElement("video");
    const player = videojs(video);

    super(new WebEventEmiter(player));

    this.video = video;
    this.player = player;
    this.mediaSession = new MediaSessionHandler(this.player);

    this.replaceSourceAsync(source);
  }

  /**
   * Cleans up player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * @internal
   */
  __destroy() {
    this.player.dispose();
  }

  __getNativeRef() {
    return this.video;
  }

  /**
   * Handles parsing native errors to VideoRuntimeError and calling onError if provided
   * @internal
   */
  private throwError(error: unknown) {
    const parsedError = tryParseNativeVideoError(error);

    if (
      parsedError instanceof VideoRuntimeError &&
      this.triggerEvent("onError", parsedError)
    ) {
      // We don't throw errors if onError is provided
      return;
    }

    throw parsedError;
  }

  // Source
  get source(): VideoPlayerSource {
    // TODO: properly implement this
    return {
      uri: this.player.src(undefined),
      config: {},
    } as any;
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
    if (value) this.mediaSession.enable();
    else this.mediaSession.disable();
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
    this.player.play()?.catch(this.throwError);
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
      | NoAutocomplete<VideoPlayerSource>
      | null,
  ): Promise<void> {
    if (!source) {
      this.player.src([]);
      this.player.reset();
      return;
    }

    if (typeof source === "number") {
      console.error(
        "A source uri must be a string. Numbers are only supported on native.",
      );
      return;
    }
    if (typeof source === "string") {
      source = { uri: source };
    }
    // TODO: handle start time
    this.player.src({
      src: source.uri,
      type: source.mimeType,
    });
    if (source.initializeOnCreation) await this.preload();
  }

  // Text Track Management

  getAvailableTextTracks(): TextTrack[] {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTextTracks = this.player.textTracks();

    return [...Array(tracks.length)].map((_, i) => ({
      id: tracks[i]!.id,
      label: tracks[i]!.label,
      language: tracks[i]!.language,
      selected: tracks[i]!.mode === "showing",
    }));
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    // @ts-expect-error they define length & index properties via prototype
    const tracks: VideoJsTextTracks = this.player.textTracks();

    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i]!.mode === "showing") tracks[i]!.mode = "disabled";
      if (tracks[i]!.id === textTrack?.id) tracks[i]!.mode = "showing";
    }
  }

  // Selected Text Track
  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }
}

export { VideoPlayer };
