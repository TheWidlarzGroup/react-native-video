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
}

export interface VideoPlayerFactory
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  createPlayer(source: VideoPlayerSource): VideoPlayer;
}
