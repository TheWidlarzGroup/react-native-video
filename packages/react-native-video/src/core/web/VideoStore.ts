/**
 * video.js store interface.
 * Represents the reactive store created by @videojs/react's createPlayer.
 * Used as the primary data source when VideoView is mounted;
 * HTMLVideoElement is the fallback when store is not available.
 */
export interface VideoStore {
  // State
  readonly paused: boolean;
  readonly ended: boolean;
  readonly waiting: boolean;
  readonly seeking: boolean;
  readonly canPlay: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly volume: number;
  readonly muted: boolean;
  readonly playbackRate: number;
  readonly source: string | null;
  readonly buffered: [number, number][];
  readonly error: { code: number; message: string } | null;
  readonly textTrackList: Array<{
    kind: string;
    label: string;
    language: string;
    mode: string;
  }>;
  readonly destroyed: boolean;
  readonly target: unknown;
  readonly pipAvailability: string;

  // Actions
  play(): Promise<void>;
  pause(): void;
  seek(time: number): Promise<number>;
  setVolume(volume: number): number;
  setPlaybackRate(rate: number): void;
  loadSource(src: string): string;
  requestFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  requestPictureInPicture(): Promise<void>;
  exitPictureInPicture(): Promise<void>;

  // Lifecycle
  subscribe(callback: () => void): () => void;
  attach(target: {
    media: HTMLVideoElement;
    container: HTMLElement | null;
  }): () => void;
  destroy(): void;
}

/**
 * Subset of VideoStore used by MediaSessionHandler.
 */
export type MediaSessionStore = Pick<
  VideoStore,
  | 'paused'
  | 'currentTime'
  | 'duration'
  | 'playbackRate'
  | 'play'
  | 'pause'
  | 'seek'
  | 'subscribe'
>;
