/**
 * No-op on web — audio session management is an iOS-only feature.
 */
export const setAudioSessionManagementDisabled = (_disabled: boolean): void => {
  // no-op on web
};
