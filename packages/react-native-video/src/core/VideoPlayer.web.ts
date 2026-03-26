import type { AudioTrack } from './types/AudioTrack';
import type { IgnoreSilentSwitchMode } from './types/IgnoreSilentSwitchMode';
import type { MixAudioMode } from './types/MixAudioMode';
import type { TextTrack } from './types/TextTrack';
import type { VideoTrack } from './types/VideoTrack';
import type { NoAutocomplete } from './types/Utils';
import type {
  NativeVideoConfig,
  VideoConfig,
  VideoSource,
} from './types/VideoConfig';
import type { WebVideoPlayer } from './types/WebVideoPlayer';
import type { VideoPlayerSourceBase } from './types/VideoPlayerSourceBase';
import type { VideoPlayerStatus } from './types/VideoPlayerStatus';
import { VideoPlayerEvents } from './events/VideoPlayerEvents';
import { MediaSessionHandler } from './web/MediaSession';
import { WebEventEmitter } from './web/WebEventEmitter';
import type { VideoStore } from './web/VideoStore';

function setExternalSubtitles(
  video: HTMLVideoElement,
  subtitles: NativeVideoConfig['externalSubtitles']
) {
  video.querySelectorAll('track').forEach((t) => t.remove());
  for (const sub of subtitles ?? []) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.src = sub.uri;
    track.srclang = sub.language ?? 'und';
    track.label = sub.label;
    video.appendChild(track);
  }
}

type TrackType = 'textTracks' | 'audioTracks' | 'videoTracks';

/**
 * Reads tracks from HTMLVideoElement.
 * textTracks: 100% browser support. Uses .mode === "showing" for selection.
 * audioTracks/videoTracks: ~16% support (Safari only, flags in Chrome/Firefox). Uses .enabled/.selected.
 */
function getTracks(
  video: HTMLVideoElement,
  prop: TrackType
): Array<{ id: string; label: string; language?: string; selected: boolean }> {
  const tracks = (video as any)[prop];
  if (!tracks) return [];
  const result = [];
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i]!;
    const selected =
      prop === 'textTracks'
        ? t.mode === 'showing'
        : prop === 'audioTracks'
          ? t.enabled
          : t.selected;
    result.push({
      id: t.id || t.label,
      label: t.label,
      language: t.language,
      selected,
    });
  }
  return result;
}

function selectTrack(
  video: HTMLVideoElement,
  prop: TrackType,
  trackId: string | null
): void {
  const tracks = (video as any)[prop];
  if (!tracks) return;
  for (let i = 0; i < tracks.length; i++) {
    const id = tracks[i]!.id || tracks[i]!.label;
    if (prop === 'textTracks') {
      tracks[i]!.mode = id === trackId ? 'showing' : 'disabled';
    } else if (prop === 'audioTracks') {
      tracks[i]!.enabled = id === trackId;
    } else {
      tracks[i]!.selected = id === trackId;
    }
  }
}

class VideoPlayer extends VideoPlayerEvents implements WebVideoPlayer {
  private video: HTMLVideoElement;
  private _storeRef: WeakRef<VideoStore> | null = null;
  private mediaSession: MediaSessionHandler | null = null;
  private _source: NativeVideoConfig | undefined;

  /** Returns store if alive, null if destroyed or disconnected. */
  private get _store(): VideoStore | null {
    const store = this._storeRef?.deref() ?? null;
    return store?.destroyed ? null : store;
  }

  /** Store when available, video element fallback. */
  private get media(): VideoStore | HTMLVideoElement {
    return this._store ?? this.video;
  }

  /**
   * Creates a detached <video> element that works immediately.
   * VideoView later mounts it into the DOM and connects the video.js store.
   */
  constructor(source: VideoSource | VideoConfig | VideoPlayerSourceBase) {
    if (typeof window === 'undefined') {
      throw new Error(
        '[react-native-video] VideoPlayer cannot be created in SSR environment.'
      );
    }

    const video = document.createElement('video');
    video.playsInline = true;

    super(new WebEventEmitter(null, () => video));
    this.video = video;

    (this.eventEmitter as WebEventEmitter).addOnErrorListener((error) => {
      this.triggerJSEvent('onError', error);
    });

    this.replaceSourceAsync(source);
  }

  // --- Internal (used by VideoView) ---

  /** @internal */
  __setStore(store: VideoStore | null) {
    this._storeRef = store ? new WeakRef(store) : null;
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
    this._storeRef = null;
  }

  /** @internal */
  __getMedia(): HTMLVideoElement {
    return this.video;
  }

  // --- Playback state (read from store or video element) ---

  get source(): VideoPlayerSourceBase {
    return {
      uri: this._source?.uri ?? '',
      config: this._source ?? { uri: '' },
      getAssetInformationAsync: async () => ({
        bitrate: NaN,
        width: this.video.videoWidth,
        height: this.video.videoHeight,
        duration: this.video.duration || NaN,
        fileSize: -1n,
        isHDR: false,
        isLive: false,
        orientation: 'landscape' as const,
      }),
    };
  }

  get status(): VideoPlayerStatus {
    if (this.media.error) return 'error';
    if (this.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
      return 'readyToPlay';
    if (this.video.readyState > HTMLMediaElement.HAVE_NOTHING) return 'loading';
    if (this.video.src) return 'loading';
    return 'idle';
  }

  get duration(): number {
    return this.media.duration || NaN;
  }
  get currentTime(): number {
    return this.media.currentTime;
  }
  get volume(): number {
    return this.media.volume;
  }
  get muted(): boolean {
    return this.media.muted;
  }
  get loop(): boolean {
    return this.video.loop;
  }
  get rate(): number {
    return this.media.playbackRate;
  }
  get isPlaying(): boolean {
    return !this.media.paused;
  }

  // --- Playback state (write through store or video element) ---

  set volume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    this._store
      ? this._store.setVolume(clamped)
      : (this.video.volume = clamped);
  }

  set currentTime(v: number) {
    this._store ? this._store.seek(v) : (this.video.currentTime = v);
  }

  // video.js store has toggleMuted() but no direct setter
  set muted(v: boolean) {
    this.video.muted = v;
  }
  set loop(v: boolean) {
    this.video.loop = v;
  }

  set rate(v: number) {
    this._store
      ? this._store.setPlaybackRate(v)
      : (this.video.playbackRate = v);
  }

  // --- Unsupported on web (no-op) ---

  get mixAudioMode(): MixAudioMode {
    return 'auto';
  }
  set mixAudioMode(_: MixAudioMode) {}
  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode {
    return 'auto';
  }
  set ignoreSilentSwitchMode(_: IgnoreSilentSwitchMode) {}
  get playInBackground(): boolean {
    return true;
  }
  set playInBackground(_: boolean) {}
  get playWhenInactive(): boolean {
    return true;
  }
  set playWhenInactive(_: boolean) {}

  // --- Media Session ---

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

  // --- Playback actions ---

  async initialize(): Promise<void> {}

  async preload(): Promise<void> {
    this.video.preload = 'auto';
    this.video.load();
  }

  release(): void {
    this.__destroy();
  }
  play(): void {
    this.media.play()?.catch(() => {});
  }
  pause(): void {
    this.media.pause();
  }

  seekTo(time: number): void {
    this._store ? this._store.seek(time) : (this.video.currentTime = time);
  }

  seekBy(time: number): void {
    this.seekTo(this.media.currentTime + time);
  }

  // --- Source management ---

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSourceBase>
      | null
  ): Promise<void> {
    if (!source) {
      this.video.removeAttribute('src');
      this.video.load();
      this._source = undefined;
      return;
    }

    if (typeof source === 'string') {
      source = { uri: source };
    }

    if (typeof source === 'number' || typeof source.uri === 'number') {
      console.error(
        'A source uri must be a string. Numbers are only supported on native.'
      );
      return;
    }

    this._source = source as NativeVideoConfig;
    this._store
      ? this._store.loadSource(source.uri)
      : (this.video.src = source.uri);

    if (this.mediaSession?.enabled) {
      this.mediaSession.updateMediaSession(source.metadata);
    }

    setExternalSubtitles(this.video, source.externalSubtitles);

    if (source.initializeOnCreation) await this.preload();
  }

  // --- Tracks ---

  getAvailableTextTracks(): TextTrack[] {
    return getTracks(this.video, 'textTracks');
  }
  selectTextTrack(t: TextTrack | null): void {
    selectTrack(this.video, 'textTracks', t?.id ?? null);
  }
  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }

  // Audio/video tracks: web-only, ~16% browser support (Safari only, flags in Chrome/Firefox)
  getAvailableAudioTracks(): AudioTrack[] {
    return getTracks(this.video, 'audioTracks');
  }
  selectAudioTrack(t: AudioTrack | null): void {
    selectTrack(this.video, 'audioTracks', t?.id ?? null);
  }
  get selectedAudioTrack(): AudioTrack | undefined {
    return this.getAvailableAudioTracks().find((x) => x.selected);
  }

  getAvailableVideoTracks(): VideoTrack[] {
    return getTracks(this.video, 'videoTracks');
  }
  selectVideoTrack(t: VideoTrack | null): void {
    selectTrack(this.video, 'videoTracks', t?.id ?? null);
  }
  get selectedVideoTrack(): VideoTrack | undefined {
    return this.getAvailableVideoTracks().find((x) => x.selected);
  }
}

export { VideoPlayer };
