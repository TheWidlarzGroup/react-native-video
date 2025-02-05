import { type VideoPlayer as VideoPlayerImpl } from '../spec/nitro/VideoPlayer.nitro';
import type { VideoPlayerSource } from '../spec/nitro/VideoPlayerSource.nitro';
import type { VideoConfig, VideoSource } from './types/VideoConfig';
import {
  tryParseNativeVideoError,
  VideoRuntimeError,
} from './types/VideoError';
import type { VideoPlayerBase } from './types/VideoPlayerBase';
import { createPlayer } from './utils/playerFactory';
import { createSource } from './utils/sourceFactory';

class VideoPlayer implements VideoPlayerBase {
  protected player: VideoPlayerImpl;

  public onError?: (error: VideoRuntimeError) => void = undefined;

  constructor(source: VideoSource | VideoConfig | VideoPlayerSource) {
    this.player = createPlayer(createSource(source));
  }

  /**
   * Cleans up player's native resources and releases native state.
   * After calling this method, the player is no longer usable.
   * @internal
   */
  __destroy() {
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
      promise.then(resolve).catch(reject);
    });
  }

  get source(): VideoPlayerSource {
    return this.player.source;
  }

  get duration(): number {
    return this.player.duration;
  }

  get volume(): number {
    return this.player.volume;
  }

  set volume(value: number) {
    this.player.volume = value;
  }

  get currentTime(): number {
    return this.player.currentTime;
  }

  set currentTime(value: number) {
    this.player.currentTime = value;
  }

  preload(): Promise<void> {
    return this.wrapPromise(this.player.preload());
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

  replaceSourceAsync(
    source: VideoSource | VideoConfig | VideoPlayerSource
  ): Promise<void> {
    return this.wrapPromise(
      this.player.replaceSourceAsync(createSource(source))
    );
  }
}

export { VideoPlayer };
