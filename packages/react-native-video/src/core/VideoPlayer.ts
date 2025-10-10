import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { VideoPlayer as VideoPlayerImpl } from '../spec/nitro/VideoPlayer.nitro';
import type { VideoPlayerSource } from '../spec/nitro/VideoPlayerSource.nitro';
import type { IgnoreSilentSwitchMode } from './types/IgnoreSilentSwitchMode';
import type { MixAudioMode } from './types/MixAudioMode';
import type { TextTrack } from './types/TextTrack';
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

    if (
      parsedError instanceof VideoRuntimeError &&
      this.triggerEvent('onError', parsedError)
    ) {
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

  // Mix Audio Mode
  get mixAudioMode(): MixAudioMode {
    return this.player.mixAudioMode;
  }

  set mixAudioMode(value: MixAudioMode) {
    this.player.mixAudioMode = value;
  }

  // Ignore Silent Switch Mode
  get ignoreSilentSwitchMode(): IgnoreSilentSwitchMode {
    return this.player.ignoreSilentSwitchMode;
  }

  set ignoreSilentSwitchMode(value: IgnoreSilentSwitchMode) {
    if (__DEV__ && !['ios'].includes(Platform.OS)) {
      console.warn(
        'ignoreSilentSwitchMode is not supported on this platform, it wont have any effect'
      );
    }

    this.player.ignoreSilentSwitchMode = value;
  }

  // Play In Background
  get playInBackground(): boolean {
    return this.player.playInBackground;
  }

  set playInBackground(value: boolean) {
    this.player.playInBackground = value;
  }

  // Play When Inactive
  get playWhenInactive(): boolean {
    return this.player.playWhenInactive;
  }

  set playWhenInactive(value: boolean) {
    this.player.playWhenInactive = value;
  }

  // Is Playing
  get isPlaying(): boolean {
    return this.player.isPlaying;
  }

  get showNotificationControls(): boolean {
    return this.player.showNotificationControls;
  }

  set showNotificationControls(value: boolean) {
    this.player.showNotificationControls = value;
  }

  async initialize(): Promise<void> {
    await this.wrapPromise(this.player.initialize());

    NitroModules.updateMemorySize(this.player);
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

  // Text Track Management
  getAvailableTextTracks(): TextTrack[] {
    try {
      return this.player.getAvailableTextTracks();
    } catch (error) {
      this.throwError(error);
      return [];
    }
  }

  selectTextTrack(textTrack: TextTrack | null): void {
    try {
      this.player.selectTextTrack(textTrack);
    } catch (error) {
      this.throwError(error);
    }
  }

  // Selected Text Track
  get selectedTrack(): TextTrack | undefined {
    return this.player.selectedTrack;
  }
}

export { VideoPlayer };
