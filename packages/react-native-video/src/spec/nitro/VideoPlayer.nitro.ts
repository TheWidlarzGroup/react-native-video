import type { HybridObject } from 'react-native-nitro-modules';
import type { TextTrack } from '../../core/types/TextTrack';
import type { VideoPlayerBase } from '../../core/types/VideoPlayerBase';
import type { VideoPlayerEventEmitter } from './VideoPlayerEventEmitter.nitro';
import type { VideoPlayerSource } from './VideoPlayerSource.nitro';

/**
 * IMPORTANT - nitrogen cannot regenerate this HybridObject's native spec.
 *
 * `bun run specs` fails on `VideoPlayer` with:
 *   "The TypeScript type 'Event' cannot be represented in C++!"
 * caused by `VideoPlayerBase.addEventListener<Event extends keyof AllPlayerEvents>`
 * (a generic method) structurally flattening into this interface. Reproduced on
 * both nitrogen 0.35.0 and 0.37.1 (the latest at time of writing), on a clean
 * unmodified checkout - this is not caused by any one change to this file.
 *
 * Consequence: nitrogen/generated/{shared/c++,ios/swift,ios/c++,android/kotlin,
 * android/c++}/HybridVideoPlayerSpec.* are hand-maintained, not regenerated -
 * same as ios/core/Spec/NativeVideoPlayerSpec.swift already explicitly is.
 * Any change to VideoPlayerBase's member list requires hand-editing those files
 * directly, pattern-matched against the existing members (see git history on
 * this file for a worked example: isPlayingAd/adState/activateAds/deactivateAds/
 * skipAd were added this way). Do not run `bun run specs` and blindly accept its
 * output for this HybridObject or its dependents - on this codebase it has also
 * been observed to silently change unrelated, already-correct generated files
 * (e.g. onLoadStartData's bridged source type) that nobody asked to change.
 */
export interface VideoPlayer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>, VideoPlayerBase {
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

export interface VideoPlayerFactory extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
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
