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
import { VideoPlayerEvents } from "./events/VideoPlayerEvents";
import { MediaSessionHandler } from "./web/MediaSession";
import { WebEventEmitter, type VideoStore } from "./web/WebEventEmitter";

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  private video: HTMLVideoElement;
  private _store: VideoStore | null = null;
  private mediaSession: MediaSessionHandler | null = null;
  private _source: NativeVideoConfig | undefined;

  /**
   * Creates a detached <video> element that works immediately.
   * VideoView later mounts it into the DOM and connects the video.js store.
   */
  constructor(source: VideoSource | VideoConfig | VideoPlayerSourceBase) {
    if (typeof window === "undefined") {
      throw new Error("[react-native-video] VideoPlayer cannot be created in SSR environment.");
    }

    const video = document.createElement("video");
    video.playsInline = true;

    const emitter = new WebEventEmitter(null, () => video);
    super(emitter);

    this.video = video;

    (this.eventEmitter as WebEventEmitter).addOnErrorListener((error) => {
      this.triggerJSEvent("onError", error);
    });

    this.replaceSourceAsync(source);
  }

  /** @internal */
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
    // Store destroy calls detach internally — safe here since player is dead
    if (this._store?.destroyed === false) {
      this._store.destroy();
    }
    this._store = null;
  }

  /** @internal */
  __getMedia(): HTMLVideoElement {
    return this.video;
  }

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

  // Store when available, video element fallback.
  // Store may provide more accurate values for HLS/DASH/DRM content.

  get status(): VideoPlayerStatus {
    const s = this._store;
    if (s) {
      if (s.error) return "error";
      if (s.canPlay) return "readyToPlay";
      if (s.waiting) return "loading";
      if (s.source) return "loading";
      return "idle";
    }
    if (this.video.error) return "error";
    if (this.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return "readyToPlay";
    if (this.video.readyState > HTMLMediaElement.HAVE_NOTHING) return "loading";
    if (this.video.src) return "loading";
    return "idle";
  }

  get duration(): number { return this._store?.duration || this.video.duration || NaN; }
  get volume(): number { return this._store?.volume ?? this.video.volume; }
  set volume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    if (this._store) { this._store.setVolume(clamped); } else { this.video.volume = clamped; }
  }
  get currentTime(): number { return this._store?.currentTime ?? this.video.currentTime; }
  set currentTime(v: number) {
    if (this._store) { this._store.seek(v); } else { this.video.currentTime = v; }
  }
  get muted(): boolean { return this._store?.muted ?? this.video.muted; }
  set muted(v: boolean) { this.video.muted = v; }
  get loop(): boolean { return this.video.loop; }
  set loop(v: boolean) { this.video.loop = v; }
  get rate(): number { return this._store?.playbackRate ?? this.video.playbackRate; }
  set rate(v: number) {
    if (this._store) { this._store.setPlaybackRate(v); } else { this.video.playbackRate = v; }
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
    return this._store ? !this._store.paused : !this.video.paused && !this.video.ended;
  }

  get showNotificationControls(): boolean {
    return this.mediaSession?.enabled ?? false;
  }

  set showNotificationControls(value: boolean) {
    if (!this.mediaSession) return;
    if (!value) { this.mediaSession.disable(); return; }
    this.mediaSession.enable();
    this.mediaSession.updateMediaSession(this._source?.metadata);
  }

  async initialize(): Promise<void> {}
  async preload(): Promise<void> {
    this.video.preload = "auto";
    this.video.load();
  }
  release(): void { this.__destroy(); }

  play(): void {
    if (this._store) { this._store.play()?.catch(() => {}); } else { this.video.play()?.catch(() => {}); }
  }

  pause(): void {
    if (this._store) { this._store.pause(); } else { this.video.pause(); }
  }

  seekBy(time: number): void {
    const now = this._store?.currentTime ?? this.video.currentTime;
    if (this._store) { this._store.seek(now + time); } else { this.video.currentTime = now + time; }
  }

  seekTo(time: number): void {
    if (this._store) { this._store.seek(time); } else { this.video.currentTime = time; }
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
    if (this._store) {
      this._store.loadSource(source.uri);
    } else {
      this.video.src = source.uri;
    }

    if (this.mediaSession?.enabled) {
      this.mediaSession.updateMediaSession(source.metadata);
    }

    const existingTracks = this.video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

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

  getAvailableTextTracks(): TextTrack[] {
    const tracks = this.video.textTracks;
    const result: TextTrack[] = [];
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]!;
      result.push({ id: t.id || t.label, label: t.label, language: t.language, selected: t.mode === "showing" });
    }
    return result;
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    const tracks = this.video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]!;
      t.mode = (t.id || t.label) === textTrack?.id ? "showing" : "disabled";
    }
  }

  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }
}

export { VideoPlayer };
