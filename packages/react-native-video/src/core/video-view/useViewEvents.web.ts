import { useEffect, useInsertionEffect, useRef } from 'react';
import type { VideoPlayer } from '../VideoPlayer.web';
import type { VideoViewEvents } from '../types/Events';
import type { ListenerSubscription } from '../types/EventEmitter';
import type { WebEventEmitter } from '../web/WebEventEmitter';

function bindViewDOMEvents(
  emitter: WebEventEmitter,
  video: HTMLVideoElement,
  container: HTMLElement | null
): () => void {
  const cleanups: Array<() => void> = [];

  const on = (target: EventTarget, event: string, handler: () => void) => {
    target.addEventListener(event, handler);
    cleanups.push(() => target.removeEventListener(event, handler));
  };

  if (container) {
    on(container, 'fullscreenchange', () => {
      const el = document.fullscreenElement;
      const isFullscreen = el === container || container.contains(el);
      emitter.__emit(
        isFullscreen ? 'willEnterFullscreen' : 'willExitFullscreen'
      );
      emitter.__emit('onFullscreenChange', isFullscreen);
    });
  }

  on(video, 'enterpictureinpicture', () => {
    emitter.__emit('willEnterPictureInPicture');
    emitter.__emit('onPictureInPictureChange', true);
  });

  on(video, 'leavepictureinpicture', () => {
    emitter.__emit('willExitPictureInPicture');
    emitter.__emit('onPictureInPictureChange', false);
  });

  return () => cleanups.forEach((fn) => fn());
}

export function useViewEvents(
  player: VideoPlayer,
  containerRef: React.RefObject<HTMLDivElement | null>,
  props: Partial<VideoViewEvents>
) {
  const emitter = player.__getEmitter();
  const callbacksRef = useRef(props);
  useInsertionEffect(() => {
    callbacksRef.current = props;
  });

  useEffect(() => {
    const unbindDOM = bindViewDOMEvents(
      emitter,
      player.__getMedia(),
      containerRef.current
    );

    const subs: ListenerSubscription[] = [];
    for (const event of Object.keys(callbacksRef.current)) {
      subs.push(
        emitter.__addListener(event, (...args: unknown[]) => {
          callbacksRef.current[event as keyof VideoViewEvents]?.(...args);
        })
      );
    }

    return () => {
      unbindDOM();
      subs.forEach((sub) => sub.remove());
    };
  }, [player, emitter, containerRef]);
}

export function addViewEventListener<Event extends keyof VideoViewEvents>(
  player: VideoPlayer,
  event: Event,
  callback: VideoViewEvents[Event]
): ListenerSubscription {
  return player.__getEmitter().__addListener(event, callback);
}
