import type { CustomVideoMetadata } from "../types/VideoConfig";

function getMediaSession(): MediaSession | undefined {
  if (typeof window === "undefined") return undefined;
  return window.navigator?.mediaSession;
}

/**
 * video.js store interface — the subset MediaSession needs.
 */
interface MediaSessionStore {
  readonly paused: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly playbackRate: number;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): Promise<number>;
  subscribe(callback: () => void): () => void;
}

export class MediaSessionHandler {
  enabled: boolean = false;

  constructor(private store: MediaSessionStore) {}

  enable() {
    const mediaSession = getMediaSession();
    if (!mediaSession) return;

    this.enabled = true;

    const defaultSkipTime = 15;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => { this.store.play(); }],
      ["pause", () => { this.store.pause(); }],
      ["stop", () => {
        this.store.pause();
        this.store.seek(0);
      }],
      ["seekbackward", (details) => {
        const offset = (details as MediaSessionActionDetails).seekOffset || defaultSkipTime;
        this.store.seek(Math.max(0, this.store.currentTime - offset));
      }],
      ["seekforward", (details) => {
        const offset = (details as MediaSessionActionDetails).seekOffset || defaultSkipTime;
        this.store.seek(Math.min(this.store.duration, this.store.currentTime + offset));
      }],
      ["seekto", (details) => {
        const seekTime = (details as MediaSessionActionDetails).seekTime;
        if (seekTime != null) this.store.seek(seekTime);
      }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported by browser
      }
    }

    // Subscribe to store for playback state and position updates
    const unsubscribe = this.store.subscribe(() => {
      mediaSession.playbackState = this.store.paused ? "paused" : "playing";

      if ("setPositionState" in mediaSession && Number.isFinite(this.store.duration)) {
        try {
          mediaSession.setPositionState({
            duration: this.store.duration,
            playbackRate: this.store.playbackRate,
            position: this.store.currentTime,
          });
        } catch {
          // position > duration can throw
        }
      }
    });

    this.disable = () => {
      this.enabled = false;
      unsubscribe();
      mediaSession.metadata = null;
      for (const [action] of actionHandlers) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }

  disable() {}

  updateMediaSession(metadata: CustomVideoMetadata | undefined) {
    const mediaSession = getMediaSession();
    if (!mediaSession) return;

    if (!metadata) {
      mediaSession.metadata = null;
      return;
    }
    mediaSession.metadata = new window.MediaMetadata({
      title: metadata.title,
      album: metadata.subtitle,
      artist: metadata.artist,
      artwork: metadata.imageUri ? [{ src: metadata.imageUri }] : [],
    });
  }
}
