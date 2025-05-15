import { NitroModules } from 'react-native-nitro-modules';
import { type VideoPlayer as VideoPlayerImpl } from '../spec/nitro/VideoPlayer.nitro';
import type { VideoPlayerSource } from '../spec/nitro/VideoPlayerSource.nitro';
import type { NoAutocomplete } from './types/Utils';
import type { VideoConfig, VideoSource } from './types/VideoConfig';
import {
  tryParseNativeVideoError,
  VideoRuntimeError,
} from './types/VideoError';
import type { VideoPlayerBase } from './types/VideoPlayerBase';
import type { VideoPlayerStatus } from './types/VideoPlayerStatus';
import { createPlayer } from './utils/playerFactory';
import { createSource } from './utils/sourceFactory';
import { VideoPlayerEvents } from './VideoPlayerEvents';

class VideoPlayer extends VideoPlayerEvents implements VideoPlayerBase {
  protected player: VideoPlayerImpl;

  public onError?: (error: VideoRuntimeError) => void = undefined;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSource) {
    const hybridSource = createSource(source);
    const player = createPlayer(hybridSource);

    // Initialize events
    super(player.eventEmitter);
    this.player = player;
  }

  /**
   * Cleans up player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * @internal
   */
  __destroy() {
    this.clearAllEvents();
    this.player.dispose();
  }

  /**
   * Returns the native (hybrid) player instance.
   * Should not be used outside of the module.
   * @internal
   */
  __getNativePlayer() {
    return this.player;
  }

  /**
   * Handles parsing native errors to VideoRuntimeError and calling onError if provided
   * @internal
   */
  private throwError(error: unknown) {
    const parsedError = tryParseNativeVideoError(error);

    if (parsedError instanceof VideoRuntimeError) {
      if (this.onError) {
        this.onError(parsedError);
      }

      // We don't throw errors if onError is provided
      return;
    }

    throw parsedError;
  }

  /**
   * Wraps a promise to try parsing native errors to VideoRuntimeError
   * @internal
   */
  private wrapPromise<T>(promise: Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      promise.then(resolve).catch((error) => {
        reject(this.throwError(error));
      });
    });
  }

  // Source
  get source(): VideoPlayerSource {
    return this.player.source;
  }

  // Status
  get status(): VideoPlayerStatus {
    return this.player.status;
  }

  // Duration
  get duration(): number {
    return this.player.duration;
  }

  // Volume
  get volume(): number {
    return this.player.volume;
  }

  set volume(value: number) {
    this.player.volume = value;
  }

  // Current Time
  get currentTime(): number {
    return this.player.currentTime;
  }

  set currentTime(value: number) {
    this.player.currentTime = value;
  }

  // Muted
  get muted(): boolean {
    return this.player.muted;
  }

  set muted(value: boolean) {
    this.player.muted = value;
  }

  // Loop
  get loop(): boolean {
    return this.player.loop;
  }

  set loop(value: boolean) {
    this.player.loop = value;
  }

  // Rate
  get rate(): number {
    return this.player.rate;
  }

  set rate(value: number) {
    this.player.rate = value;
  }

  async preload(): Promise<void> {
    await this.wrapPromise(this.player.preload());

    NitroModules.updateMemorySize(this.player);
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
      this.player.play();
    } catch (error) {
      this.throwError(error);
    }
  }

  pause(): void {
    try {
      this.player.pause();
    } catch (error) {
      this.throwError(error);
    }
  }

  seekBy(time: number): void {
    try {
      this.player.seekBy(time);
    } catch (error) {
      this.throwError(error);
    }
  }

  seekTo(time: number): void {
    try {
      this.player.seekTo(time);
    } catch (error) {
      this.throwError(error);
    }
  }

  async replaceSourceAsync(
    source: VideoSource | VideoConfig | NoAutocomplete<VideoPlayerSource> | null
  ): Promise<void> {
    await this.wrapPromise(
      this.player.replaceSourceAsync(
        source === null ? null : createSource(source)
      )
    );

    NitroModules.updateMemorySize(this.player);
  }
}

export { VideoPlayer };
