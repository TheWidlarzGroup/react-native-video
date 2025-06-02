import { useEffect } from 'react';
import { VideoPlayer } from '../VideoPlayer';
import { type VideoPlayerEvents } from '../types/Events';

// Omit undefined from events
type NonUndefined<T> = T extends undefined ? never : T;

// Valid events names
type Events = keyof VideoPlayerEvents | 'onError';

// Valid events params
type EventsParams<T extends Events> = T extends keyof VideoPlayerEvents
  ? // (Native) Events from VideoPlayerEvents
    Parameters<VideoPlayerEvents[T]>
  : // (JS) Events from Video Player
    Parameters<NonUndefined<VideoPlayer[T]>>;

/**
 * Attaches an event listener to a `VideoPlayer` instance for a specified event.
 *
 * @param player - The player to attach the event to
 * @param event - The name of the event to attach the callback to
 * @param callback - The callback for the event
 */
export const useEvent = <T extends Events>(
  player: VideoPlayer,
  event: T,
  callback: (...args: EventsParams<T>) => void
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
