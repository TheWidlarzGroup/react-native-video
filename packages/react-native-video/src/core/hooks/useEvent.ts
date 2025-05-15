import { useEffect } from 'react';
import { VideoPlayer } from '../VideoPlayer';
import { type VideoPlayerEvents } from '../types/Events';

type Events = keyof VideoPlayerEvents & 'onError';

export const useEvent = <T extends Events>(
  player: VideoPlayer,
  event: T,
  callback: (...args: Parameters<VideoPlayerEvents[T]>) => void
) => {
  useEffect(() => {
    // @ts-expect-error we narrow the type of the event
    player[event] = callback;

    return () => {
      if (event === 'onError') {
        // onError is not native event, so we can set it to undefined
        player.onError = undefined;
      } else {
        player.clearEvent(event);
      }
    };
  }, [player, event, callback]);
};
