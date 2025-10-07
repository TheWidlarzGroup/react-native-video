import shaka from "shaka-player";
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
import { WebEventEmiter } from "./WebEventEmiter";

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  protected player = new shaka.Player();
  protected video: HTMLVideoElement;
  protected headers: Record<string, string> = {};

  constructor(source: VideoSource | VideoConfig | VideoPlayerSource) {
    const video = document.createElement("video");
    super(new WebEventEmiter(video));
    this.video = video;
    this.player.attach(this.video);
    this.player.getNetworkingEngine()!.registerRequestFilter((_type, request) => {
      request.headers = this.headers;
    });
    this.replaceSourceAsync(source);
  }

  /**
   * Cleans up player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * @internal
   */
  __destroy() {
    this.player.destroy();
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
    return {
      uri: this.player.getAssetUri()!,
      config: {},
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
    return this.video.duration;
  }

  // Volume
  get volume(): number {
    return this.video.volume;
  }

  set volume(value: number) {
    this.video.volume = value;
  }

  // Current Time
  get currentTime(): number {
    return this.video.currentTime;
  }

  set currentTime(value: number) {
    this.video.currentTime = value;
  }

  // Muted
  get muted(): boolean {
    return this.video.muted;
  }

  set muted(value: boolean) {
    this.video.muted = value;
  }

  // Loop
  get loop(): boolean {
    return this.video.loop;
  }

  set loop(value: boolean) {
    this.video.loop = value;
  }

  // Rate
  get rate(): number {
    return this.video.playbackRate;
  }

  set rate(value: number) {
    this.video.playbackRate = value;
  }

  // Mix Audio Mode
  get mixAudioMode(): MixAudioMode {
    return "auto";
  }

  set mixAudioMode(_: MixAudioMode) {
    if (__DEV__) {
      console.warn(
        "mixAudioMode is not supported on this platform, it wont have any effect",
      );
    }
  }

  // Ignore Silent Switch Mode
  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode {
    return "auto";
  }

  set ignoreSilentSwitchMode(_: IgnoreSilentSwitchMode) {
    if (__DEV__) {
      console.warn(
        "ignoreSilentSwitchMode is not supported on this platform, it wont have any effect",
      );
    }
  }

  // Play In Background
  get playInBackground(): boolean {
    return true;
  }

  set playInBackground(_: boolean) {
    if (__DEV__) {
      console.warn(
        "playInBackground is not supported on this platform, it wont have any effect",
      );
    }
  }

  // Play When Inactive
  get playWhenInactive(): boolean {
    return true;
  }

  set playWhenInactive(_: boolean) {
    if (__DEV__) {
      console.warn(
        "playWhenInactive is not supported on this platform, it wont have any effect",
      );
    }
  }

  // Is Playing
  get isPlaying(): boolean {
    return this.status === "readyToPlay" && !this.video.paused;
  }

  async initialize(): Promise<void> {
    // noop on web
  }

  async preload(): Promise<void> {
    // we start loading when initializing the source.
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
    try {
      this.video.play();
    } catch (error) {
      this.throwError(error);
    }
  }

  pause(): void {
    try {
      this.video.pause();
    } catch (error) {
      this.throwError(error);
    }
  }

  seekBy(time: number): void {
    try {
      this.video.currentTime += time;
    } catch (error) {
      this.throwError(error);
    }
  }

  seekTo(time: number): void {
    try {
      this.video.currentTime = time;
    } catch (error) {
      this.throwError(error);
    }
  }

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSource>
      | null,
  ): Promise<void> {
    const src =
      typeof source === "object" && source && "uri" in source
        ? source.uri
        : source;
    if (typeof src === "number") {
      console.error("A source uri must be a string. Numbers are only supported on native.");
      return;
    }
    // TODO: handle start time
    this.player.load(src)
    if (typeof source !== "object") return;

    this.headers = source?.headers ?? {};
		// this.player.configure({
		//     drm: undefined,
		//     streaming: {
		//       bufferingGoal: source?.bufferConfig?.maxBufferMs,
		//     },
		// } satisfies Partial<shaka.extern.PlayerConfiguration>);
  }

  // Text Track Management
  getAvailableTextTracks(): TextTrack[] {
    return this.player.getTextTracks().map(x => ({
      id: x.id.toString(),
      label: x.label ?? "",
      language: x.language,
      selected: x.active,
    }));
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    this.player.setTextTrackVisibility(textTrack !== null)
    if (!textTrack) return;
    const track = this.player
      .getTextTracks()
      .find((x) => x.id === Number(textTrack.id));
    if (track) this.player.selectTextTrack(track);
  }

  // Selected Text Track
  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find(x => x.selected);
  }
}

export { VideoPlayer };
