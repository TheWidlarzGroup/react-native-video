/**
 * Fine-grained configuration of the native controls shown by `VideoView`
 * when the `controls` prop is enabled.
 *
 * @platform android
 */
export interface ControlsStyles {
  /** Hide the seek bar. Defaults to false. */
  hideSeekBar?: boolean;
  /** Hide the total duration label. Defaults to false. */
  hideDuration?: boolean;
  /** Hide the current position label. Defaults to false. */
  hidePosition?: boolean;
  /** Hide the play/pause button. Defaults to false. */
  hidePlayPause?: boolean;
  /** Hide the fast-forward button. Defaults to false. */
  hideForward?: boolean;
  /** Hide the rewind button. Defaults to false. */
  hideRewind?: boolean;
  /** Hide the "next" button. Defaults to false. */
  hideNext?: boolean;
  /** Hide the "previous" button. Defaults to false. */
  hidePrevious?: boolean;
  /**
   * Hide the button that enters fullscreen. The button that leaves fullscreen
   * is always shown. Defaults to false.
   */
  hideFullscreen?: boolean;
  /** Hide the settings (playback speed, tracks) button. Defaults to false. */
  hideSettingButton?: boolean;
  /** Hide the system navigation bar while in fullscreen. Defaults to true. */
  hideNavigationBarOnFullScreenMode?: boolean;
  /** Hide the system status bar while in fullscreen. Defaults to true. */
  hideNotificationBarOnFullScreenMode?: boolean;
}

/**
 * `ControlsStyles` with every field resolved, as it is sent to the native view.
 * @internal
 */
export interface NativeControlsStyles {
  hideSeekBar: boolean;
  hideDuration: boolean;
  hidePosition: boolean;
  hidePlayPause: boolean;
  hideForward: boolean;
  hideRewind: boolean;
  hideNext: boolean;
  hidePrevious: boolean;
  hideFullscreen: boolean;
  hideSettingButton: boolean;
  hideNavigationBarOnFullScreenMode: boolean;
  hideNotificationBarOnFullScreenMode: boolean;
}

export const DEFAULT_CONTROLS_STYLES: NativeControlsStyles = {
  hideSeekBar: false,
  hideDuration: false,
  hidePosition: false,
  hidePlayPause: false,
  hideForward: false,
  hideRewind: false,
  hideNext: false,
  hidePrevious: false,
  hideFullscreen: false,
  hideSettingButton: false,
  hideNavigationBarOnFullScreenMode: true,
  hideNotificationBarOnFullScreenMode: true,
};

/**
 * Fills in the defaults and drops unknown keys, so the native side always
 * receives a complete object.
 * @internal
 */
export const resolveControlsStyles = (
  styles?: ControlsStyles | null
): NativeControlsStyles => {
  const resolved = { ...DEFAULT_CONTROLS_STYLES };
  if (!styles) {
    return resolved;
  }
  for (const key of Object.keys(resolved) as (keyof NativeControlsStyles)[]) {
    const value = styles[key];
    if (typeof value === 'boolean') {
      resolved[key] = value;
    }
  }
  return resolved;
};
