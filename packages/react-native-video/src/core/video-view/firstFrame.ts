import type { VideoPlayerBase } from '../types/VideoPlayerBase';

type FirstFrameState = { shown: boolean };

const states = new WeakMap<VideoPlayerBase, FirstFrameState>();

/**
 * Starts remembering whether the player's current source has shown its first frame.
 *
 * Android reports `onReadyToDisplay` once per source, whichever view draws the frame, so a
 * view that mounts later (during a stall, after the end, in a second view) gets no event of
 * its own. No frame is drawn without a view, so calling this when a view renders is early
 * enough. Calling it again for the same player does nothing.
 */
export const trackFirstFrame = (player: VideoPlayerBase) => {
  if (states.has(player)) {
    return;
  }
  // The listeners hold the state, not the player, so they keep nothing else alive.
  const state: FirstFrameState = { shown: false };
  states.set(player, state);
  try {
    player.addEventListener('onLoadStart', () => {
      state.shown = false;
    });
    player.addEventListener('onReadyToDisplay', () => {
      state.shown = true;
    });
  } catch {
    // A released player emits nothing, so it never shows a frame again.
  }
};

/** Whether the player's current source has shown its first frame in any view. */
export const hasShownFirstFrame = (player: VideoPlayerBase) =>
  states.get(player)?.shown === true;
