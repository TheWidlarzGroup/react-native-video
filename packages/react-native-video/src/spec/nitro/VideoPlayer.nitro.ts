import type { HybridObject } from 'react-native-nitro-modules';
import type { TextTrack } from '../../core/types/TextTrack';
import type { VideoPlayerBase } from '../../core/types/VideoPlayerBase';
import type { VideoPlayerEventEmitter } from './VideoPlayerEventEmitter.nitro';
import type { VideoPlayerSource } from './VideoPlayerSource.nitro';

export interface VideoPlayer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>,
    VideoPlayerBase {
  // Override with (hybrid) VideoPlayerSource
  readonly source: VideoPlayerSource;

  // Holder of the video player events.
  readonly eventEmitter: VideoPlayerEventEmitter;

  /**
   * Show playback controls in the notifications area
   *
   * @note on Android, this can be overridden by {@linkcode VideoPlayer.playInBackground}, as Android requires
   * a foreground service to show notifications while the app is in the background.
   *
   * @default false
   */
  showNotificationControls: boolean;

  /**
   * Replace the current source of the player.
   * @param source - The new source of the video.
   * @note If you want to clear the source, you can pass null. It has the same effect as {@link release}.
   * see {@link VideoPlayerSourceBase}
   */
  replaceSourceAsync(source: VideoPlayerSource | null): Promise<void>;

  /**
   * Get all available text tracks for the current source.
   * @returns Array of available text tracks
   */
  getAvailableTextTracks(): TextTrack[];

  /**
   * Select a text track to display.
   * @param textTrack - Text track to select, or null to unselect current track
   */
  selectTextTrack(textTrack: TextTrack | null): void;

  /**
   * Releases the player's native resources and releases native state.
   */
  release(): void;
}

export interface VideoPlayerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createPlayer(source: VideoPlayerSource): VideoPlayer;

  /**
   * Disables the internal audio session management.
   * When disabled, react-native-video will not configure or activate the AVAudioSession,
   * allowing other libraries (like audio recording libraries) to manage it.
   *
   * @param disabled - If true, audio session management is disabled
   * @platform iOS
   */
  setAudioSessionManagementDisabled(disabled: boolean): void;
}
