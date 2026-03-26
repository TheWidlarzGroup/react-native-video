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
import { WebMediaProxy } from './web/WebMediaProxy';
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
  private _media: WebMediaProxy;
  private mediaSession: MediaSessionHandler | null = null;
  private _source: NativeVideoConfig | undefined;

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

    const media = new WebMediaProxy(video);
    const emitter = new WebEventEmitter(media);
    // WebEventEmitter uses generic dispatch, cast to satisfy base class
    super(emitter as any);
    this._media = media;

    this.replaceSourceAsync(source);
  }

  // --- Internal (used by VideoView) ---

  /** @internal */
  __setStore(store: VideoStore | null) {
    this._media.setStore(store);
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
    this._media.setStore(null);
  }

  /** @internal */
  __getEmitter(): WebEventEmitter {
    return this.eventEmitter as WebEventEmitter;
  }

  /** @internal */
  __getMedia(): HTMLVideoElement {
    return this._media.video;
  }

  // --- Playback state (read from store or video element) ---

  get source(): VideoPlayerSourceBase {
    return {
      uri: this._source?.uri ?? '',
      config: this._source ?? { uri: '' },
      getAssetInformationAsync: async () => ({
        bitrate: NaN,
        width: this._media.video.videoWidth,
        height: this._media.video.videoHeight,
        duration: this._media.duration || NaN,
        fileSize: -1n,
        isHDR: false,
        isLive: false,
        orientation: 'landscape' as const,
      }),
    };
  }

  get status(): VideoPlayerStatus {
    const video = this._media.video;
    if (this._media.error) return 'error';
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
      return 'readyToPlay';
    if (video.readyState > HTMLMediaElement.HAVE_NOTHING) return 'loading';
    if (video.src) return 'loading';
    return 'idle';
  }

  get duration(): number {
    return this._media.duration || NaN;
  }
  get currentTime(): number {
    return this._media.currentTime;
  }
  get volume(): number {
    return this._media.volume;
  }
  get muted(): boolean {
    return this._media.muted;
  }
  get loop(): boolean {
    return this._media.video.loop;
  }
  get rate(): number {
    return this._media.playbackRate;
  }
  get isPlaying(): boolean {
    return !this._media.paused;
  }

  // --- Playback state (write through store or video element) ---

  set volume(v: number) {
    this._media.setVolume(Math.max(0, Math.min(1, v)));
  }

  set currentTime(v: number) {
    this._media.seek(v);
  }

  // video.js store has toggleMuted() but no direct setter
  set muted(v: boolean) {
    this._media.video.muted = v;
  }
  set loop(v: boolean) {
    this._media.video.loop = v;
  }

  set rate(v: number) {
    this._media.setPlaybackRate(v);
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
    this._media.video.preload = 'auto';
    this._media.video.load();
  }

  release(): void {
    this.__destroy();
  }
  play(): void {
    this._media.play()?.catch(() => {});
  }
  pause(): void {
    this._media.pause();
  }

  seekTo(time: number): void {
    this._media.seek(time);
  }

  seekBy(time: number): void {
    this.seekTo(this._media.currentTime + time);
  }

  // --- Source management ---

  async replaceSourceAsync(
    source:
      | VideoSource
      | VideoConfig
      | NoAutocomplete<VideoPlayerSourceBase>
      | null
  ): Promise<void> {
    const video = this._media.video;

    if (!source) {
      video.removeAttribute('src');
      video.load();
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
    this._media.loadSource(source.uri);

    if (this.mediaSession?.enabled) {
      this.mediaSession.updateMediaSession(source.metadata);
    }

    setExternalSubtitles(video, source.externalSubtitles);

    if (source.initializeOnCreation) await this.preload();
  }

  // --- Tracks ---

  getAvailableTextTracks(): TextTrack[] {
    return getTracks(this._media.video, 'textTracks');
  }
  selectTextTrack(t: TextTrack | null): void {
    selectTrack(this._media.video, 'textTracks', t?.id ?? null);
  }
  get selectedTrack(): TextTrack | undefined {
    return this.getAvailableTextTracks().find((x) => x.selected);
  }

  // Audio/video tracks: web-only, ~16% browser support (Safari only, flags in Chrome/Firefox)
  getAvailableAudioTracks(): AudioTrack[] {
    return getTracks(this._media.video, 'audioTracks');
  }
  selectAudioTrack(t: AudioTrack | null): void {
    selectTrack(this._media.video, 'audioTracks', t?.id ?? null);
  }
  get selectedAudioTrack(): AudioTrack | undefined {
    return this.getAvailableAudioTracks().find((x) => x.selected);
  }

  getAvailableVideoTracks(): VideoTrack[] {
    return getTracks(this._media.video, 'videoTracks');
  }
  selectVideoTrack(t: VideoTrack | null): void {
    selectTrack(this._media.video, 'videoTracks', t?.id ?? null);
  }
  get selectedVideoTrack(): VideoTrack | undefined {
    return this.getAvailableVideoTracks().find((x) => x.selected);
  }
}

export { VideoPlayer };
