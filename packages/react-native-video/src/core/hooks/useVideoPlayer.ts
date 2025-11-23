import { useRef } from 'react';
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

/**
 * Creates a `VideoPlayer` instance and manages its lifecycle.
 *
 * if `initializeOnCreation` is true (default), the `setup` function will be called when the player is started loading source.
 * if `initializeOnCreation` is false, the `setup` function will be called when the player is created. changes made to player made before initializing will be overwritten when initializing.
 *
 * @param source - The source of the video to play
 * @param setup - A function to setup the player
 * @returns The `VideoPlayer` instance
 */
export const useVideoPlayer = (
  source: VideoConfig | VideoSource | NoAutocomplete<VideoPlayerSource>,
  setup?: (player: VideoPlayer) => void
) => {
  const setupCalled = useRef(false);

  return useManagedInstance(
    {
      factory: () => {
        const player = new VideoPlayer(source);

        if (setup === undefined) {
          return player;
        }

        if (player.source.config.initializeOnCreation !== false) {
          // if source is small video, it can happen that onLoadStart is called before we set event from JS
          // Thats why we adding event listener and calling setup once if player is loading or ready to play
          // That way we ensure that setup is always called

          const callSetupOnce = () => {
            if (!setupCalled.current) {
              setupCalled.current = true;
              setup?.(player);
            }
          };

          player.addEventListener('onLoadStart', callSetupOnce);
          player.addEventListener('onStatusChange', callSetupOnce);
        } else {
          setup?.(player);
        }

        return player;
      },
      cleanup: (player) => {
        player.__destroy();
        setupCalled.current = false;
      },
      dependenciesEqualFn: sourceEqual,
    },
    [JSON.stringify(source)]
  );
};
