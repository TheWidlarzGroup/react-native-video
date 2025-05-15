import type { VideoPlayerSource } from '../../spec/nitro/VideoPlayerSource.nitro';
import type { NoAutocomplete } from '../types/Utils';
import type { VideoConfig, VideoSource } from '../types/VideoConfig';
import { isVideoPlayerSource } from '../utils/sourceFactory';
import { VideoPlayer } from '../VideoPlayer';
import { useManagedInstance } from './useManagedInstance';

const sourceEqual = <T extends VideoConfig | VideoSource | VideoPlayerSource>(
  a: T,
  b?: T
) => {
  if (isVideoPlayerSource(a) && isVideoPlayerSource(b)) {
    return a.equals(b);
  }

  return JSON.stringify(a) === JSON.stringify(b);
};

export const useVideoPlayer = (
  source: VideoConfig | VideoSource | NoAutocomplete<VideoPlayerSource>,
  setup?: (player: VideoPlayer) => void
) => {
  return useManagedInstance(
    {
      factory: () => {
        const player = new VideoPlayer(source);
        setup?.(player);
        return player;
      },
      cleanup: (player) => player.__destroy(),
      dependenciesEqualFn: sourceEqual,
    },
    [source]
  );
};
