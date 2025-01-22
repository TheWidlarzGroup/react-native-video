import type { VideoPlayer } from '../spec/nitro/VideoPlayer.nitro';
import type { VideoConfig, VideoSource } from '../types/VideoConfig';
import { createPlayer } from './factory';
import { useReleasingHybridObject } from './useReleasingHybridObject';

/**
 * A hook that creates and manages a video player.
 *
 * @param source - The source of the video.
 * @param setup - A function that allow to setup the video player after it is created.
 * @returns VideoPlayer (see {@link VideoPlayer})
 */
export const useVideoPlayer = (
  source: VideoConfig | VideoSource,
  setup?: (player: VideoPlayer) => void
) => {
  return useReleasingHybridObject(
    {
      objectFactory: () => {
        const videoPlayer = createPlayer(source);
        setup?.(videoPlayer);
        return videoPlayer;
      },
    },
    [source]
  );
};
