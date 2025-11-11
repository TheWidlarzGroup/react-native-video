import { useEffect } from 'react';
import { VideoPlayer } from '../VideoPlayer';
import { type AllPlayerEvents } from '../types/Events';

/**
 * Attaches an event listener to a `VideoPlayer` instance for a specified event.
 *
 * @param player - The player to attach the event to
 * @param event - The name of the event to attach the callback to
 * @param callback - The callback for the event
 */
export const useEvent = <T extends keyof AllPlayerEvents>(
  player: VideoPlayer,
  event: T,
  callback: AllPlayerEvents[T]
) => {
  useEffect(() => {
    player.addEventListener(event, callback);

    return () => player.removeEventListener(event, callback);
  }, [player, event, callback]);
};
