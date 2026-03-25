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
import { WebEventEmitter, type VideoStore } from "./web/WebEventEmitter";

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  private video: HTMLVideoElement;
  private _store: VideoStore | null = null;
  private mediaSession: MediaSessionHandler | null = null;
  private _source: NativeVideoConfig | undefined;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSourceBase) {
    if (typeof window === "undefined") {
      throw new Error("[react-native-video] VideoPlayer cannot be created in SSR environment.");
    }

    const video = document.createElement("video");
    // Emitter starts without store — will be connected via __setStore
    const emitter = new WebEventEmitter(null, () => this.video);
    super(emitter);

    this.video = video;

    // Bridge web errors to JS event system
    (this.eventEmitter as WebEventEmitter).addOnErrorListener((error) => {
      this.triggerJSEvent("onError", error);
    });

    this.replaceSourceAsync(source);
  }

  /**
   * Called by VideoView's StoreBridge when the v10 Provider mounts.
   * Connects the v10 store to the adapter, enabling store-based features.
   * @internal
   */
  __setStore(store: VideoStore | null) {
    this._store = store;
    (this.eventEmitter as WebEventEmitter).setStore(store);
    if (store) {
      this.mediaSession = new MediaSessionHandler(store);
    } else {
      this.mediaSession?.disable();
      this.mediaSession = null;
    }
  }

  /** @internal */
  __destroy() {
    this.mediaSession?.disable();
    (this.eventEmitter as WebEventEmitter).destroy();
    this.clearAllEvents();
  }

  /** Returns the HTMLVideoElement. @internal */
  __getMedia(): HTMLVideoElement {
    return this.video;
  }

  // Source
  get source(): VideoPlayerSourceBase {
    return {
      uri: this._source?.uri ?? "",
      config: this._source ?? { uri: "" },
      getAssetInformationAsync: async () => ({
        bitrate: NaN,
        width: this.video.videoWidth,
        height: this.video.videoHeight,
        duration: this.video.duration || NaN,
        fileSize: -1n,
        isHDR: false,
        isLive: false,
        orientation: "landscape" as const,
      }),
    };
  }

  // Status — works with or without store
  get status(): VideoPlayerStatus {
    if (this.video.error) return "error";
    if (this.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return "readyToPlay";
    if (this.video.readyState > HTMLMediaElement.HAVE_NOTHING) return "loading";
    if (this.video.src) return "loading";
    return "idle";
  }

  get duration(): number {
    return this.video.duration || NaN;
  }

  get volume(): number {
    return this.video.volume;
  }

  set volume(value: number) {
    this.video.volume = Math.max(0, Math.min(1, value));
  }

  get currentTime(): number {
    return this.video.currentTime;
  }

  set currentTime(value: number) {
    this.video.currentTime = value;
  }

  get muted(): boolean {
    return this.video.muted;
  }

  set muted(value: boolean) {
    this.video.muted = value;
  }

  get loop(): boolean {
    return this.video.loop;
  }

  set loop(value: boolean) {
    this.video.loop = value;
  }

  get rate(): number {
    return this.video.playbackRate;
  }

  set rate(value: number) {
    this.video.playbackRate = value;
  }

  get mixAudioMode(): MixAudioMode { return "auto"; }
  set mixAudioMode(_: MixAudioMode) {}

  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode { return "auto"; }
  set ignoreSilentSwitchMode(_: IgnoreSilentSwitchMode) {}

  get playInBackground(): boolean { return true; }
  set playInBackground(_: boolean) {}

  get playWhenInactive(): boolean { return true; }
  set playWhenInactive(_: boolean) {}

  get isPlaying(): boolean {
    return !this.video.paused && !this.video.ended;
  }

  get showNotificationControls(): boolean {
    return this.mediaSession?.enabled ?? false;
  }

  set showNotificationControls(value: boolean) {
    if (!this.mediaSession) return;
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
    this.video.load();
  }

  release(): void {
    this.__destroy();
  }

  play(): void {
    this.video.play()?.catch(() => {});
  }

  pause(): void {
    this.video.pause();
  }

  seekBy(time: number): void {
    this.video.currentTime += time;
  }

  seekTo(time: number): void {
    this.video.currentTime = time;
  }

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSourceBase>
      | null,
  ): Promise<void> {
    if (!source) {
      this.video.removeAttribute("src");
      this.video.load();
      this._source = undefined;
      return;
    }

    if (typeof source === "string") {
      source = { uri: source };
    }

    if (typeof source === "number" || typeof source.uri === "number") {
      console.error("A source uri must be a string. Numbers are only supported on native.");
      return;
    }

    this._source = source as NativeVideoConfig;
    this.video.src = source.uri;

    if (this.mediaSession?.enabled) {
      this.mediaSession.updateMediaSession(source.metadata);
    }

    // Remove old subtitle tracks
    const existingTracks = this.video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    // Add external subtitles as <track> elements
    for (const sub of source.externalSubtitles ?? []) {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.src = sub.uri;
      track.srclang = sub.language ?? "und";
      track.label = sub.label;
      this.video.appendChild(track);
    }

    if (source.initializeOnCreation) await this.preload();
  }

  // Text Track Management

  getAvailableTextTracks(): TextTrack[] {
    const tracks = this.video.textTracks;
    const result: TextTrack[] = [];
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]!;
      result.push({
        id: t.id || t.label,
        label: t.label,
        language: t.language,
        selected: t.mode === "showing",
      });
    }
    return result;
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    const tracks = this.video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]!;
      const id = t.id || t.label;
      t.mode = id === textTrack?.id ? "showing" : "disabled";
    }
  }

  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }
}

export { VideoPlayer };
