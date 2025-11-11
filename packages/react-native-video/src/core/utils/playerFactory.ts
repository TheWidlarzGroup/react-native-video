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
