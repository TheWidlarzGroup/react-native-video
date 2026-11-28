import { describe, expect, it } from 'bun:test';

import {
  DEFAULT_CONTROLS_STYLES,
  resolveControlsStyles,
} from '../src/core/types/ControlsStyles';

describe('resolveControlsStyles', () => {
  it('returns the defaults when nothing is passed', () => {
    expect(resolveControlsStyles()).toEqual(DEFAULT_CONTROLS_STYLES);
    expect(resolveControlsStyles(null)).toEqual(DEFAULT_CONTROLS_STYLES);
    expect(resolveControlsStyles({})).toEqual(DEFAULT_CONTROLS_STYLES);
  });

  it('keeps today’s behavior by default: nothing hidden, both system bars hidden in fullscreen', () => {
    const resolved = resolveControlsStyles();

    expect(resolved.hideSeekBar).toBe(false);
    expect(resolved.hideSettingButton).toBe(false);
    expect(resolved.hideFullscreen).toBe(false);
    expect(resolved.hideNavigationBarOnFullScreenMode).toBe(true);
    expect(resolved.hideNotificationBarOnFullScreenMode).toBe(true);
  });

  it('overrides only the fields that were set', () => {
    const resolved = resolveControlsStyles({
      hideSeekBar: true,
      hideNavigationBarOnFullScreenMode: false,
    });

    expect(resolved).toEqual({
      ...DEFAULT_CONTROLS_STYLES,
      hideSeekBar: true,
      hideNavigationBarOnFullScreenMode: false,
    });
  });

  it('always sends a complete object to native and drops unknown or non-boolean values', () => {
    const resolved = resolveControlsStyles({
      hideForward: undefined,
      // v6 fields that v7 does not have, and a wrong type
      ...({
        seekIncrementMS: 5000,
        liveLabel: 'LIVE',
        hideRewind: 'yes',
      } as object),
    });

    expect(resolved).toEqual(DEFAULT_CONTROLS_STYLES);
    expect(Object.keys(resolved).sort()).toEqual(
      Object.keys(DEFAULT_CONTROLS_STYLES).sort()
    );
  });

  it('does not mutate the defaults', () => {
    resolveControlsStyles({ hidePlayPause: true });

    expect(DEFAULT_CONTROLS_STYLES.hidePlayPause).toBe(false);
  });
});
