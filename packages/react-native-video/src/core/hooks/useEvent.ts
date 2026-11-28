import * as React from 'react';
import { useEffect } from 'react';
import type { AllPlayerEvents } from '../types/Events';
import type { VideoPlayerBase } from '../types/VideoPlayerBase';

type UseEvent = <T extends keyof AllPlayerEvents>(
  player: VideoPlayerBase,
  event: T,
  callback: AllPlayerEvents[T]
) => void;

// One subscription per player and event, always the latest callback. React 19.2+ has useEffectEvent for that.
const useEffectEvent: (<F>(fn: F) => F) | undefined = (React as any)
  .useEffectEvent;

const useEventStable: UseEvent = (player, event, callback) => {
  const onEvent = useEffectEvent!(callback as (...args: unknown[]) => void);
  useEffect(() => {
    const subscription = player.addEventListener(event, ((...args: unknown[]) =>
      onEvent(...args)) as AllPlayerEvents[typeof event]);
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onEvent is an effect event
  }, [player, event]);
};

// Older React: the same single subscription, with the latest callback kept in a ref.
// Resubscribing on every callback change would add a new listener on each render with an
// inline callback, and a listener added while a source loads is told about that load again.
const useEventLegacy: UseEvent = (player, event, callback) => {
  const latest = React.useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    const subscription = player.addEventListener(event, ((...args: unknown[]) =>
      (latest.current as (...a: unknown[]) => void)(
        ...args
      )) as AllPlayerEvents[typeof event]);
    return () => {
      subscription.remove();
    };
  }, [player, event]);
};

/**
 * Attaches an event listener to a `VideoPlayer` instance for a specified event.
 *
 * @param player - The player to attach the event to
 * @param event - The name of the event to attach the callback to
 * @param callback - The callback for the event
 */
export const useEvent: UseEvent = useEffectEvent
  ? useEventStable
  : useEventLegacy;
