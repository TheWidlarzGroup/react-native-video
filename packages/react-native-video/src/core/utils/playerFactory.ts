import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoPlayer,
  VideoPlayerFactory,
} from '../../spec/nitro/VideoPlayer.nitro';
import type { VideoPlayerSource } from '../../spec/nitro/VideoPlayerSource.nitro';
import type { VideoConfig, VideoSource } from '../types/VideoConfig';
import { createSource, isVideoPlayerSource } from './sourceFactory';
import { tryParseNativeVideoError } from '../types/VideoError';

const VideoPlayerFactory =
  NitroModules.createHybridObject<VideoPlayerFactory>('VideoPlayerFactory');

/**
 * Disables the internal audio session management on iOS.
 * When disabled, react-native-video will not configure or activate the AVAudioSession,
 * allowing other libraries (like audio recording libraries) to manage it.
 *
 * @param disabled - If true, audio session management is disabled
 * @platform iOS
 *
 * @example
 * ```tsx
 * // Disable audio session management before recording
 * setAudioSessionManagementDisabled(true);
 *
 * // Record audio using another library...
 *
 * // Re-enable audio session management after recording
 * setAudioSessionManagementDisabled(false);
 * ```
 */
export const setAudioSessionManagementDisabled = (disabled: boolean): void => {
  if (Platform.OS !== 'ios') {
    if (__DEV__) {
      console.warn(
        'setAudioSessionManagementDisabled is only supported on iOS'
      );
    }
    return;
  }

  VideoPlayerFactory.setAudioSessionManagementDisabled(disabled);
};

/**
 * @internal
 * Creates a Native VideoPlayer instance.
 *
 * @param source - The source of the video to play
 * @returns The Native VideoPlayer instance
 */
export const createPlayer = (
  source: VideoSource | VideoConfig | VideoPlayerSource
): VideoPlayer => {
  try {
    if (isVideoPlayerSource(source)) {
      return VideoPlayerFactory.createPlayer(source);
    }

    return VideoPlayerFactory.createPlayer(createSource(source));
  } catch (error) {
    throw tryParseNativeVideoError(error);
  }
};
