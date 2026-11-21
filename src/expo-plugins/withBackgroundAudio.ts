import {withInfoPlist, type ConfigPlugin} from '@expo/config-plugins';

/**
 * Sets `UIBackgroundModes` in `Info.plist` to enable background audio on Apple platforms.
 * This is required for audio to continue playing when the app is in the background.
 */
export const withBackgroundAudio: ConfigPlugin<boolean> = (
  c,
  enableBackgroundAudio,
) => {
  return withInfoPlist(c, (config) => {
    const modes = config.modResults.UIBackgroundModes || [];

    if (enableBackgroundAudio) {
      if (!modes.includes('audio')) {
        config.modResults.UIBackgroundModes = [...modes, 'audio'];
      }
    } else {
      const remainingModes = modes.filter((mode: string) => mode !== 'audio');
      if (remainingModes.length > 0) {
        config.modResults.UIBackgroundModes = remainingModes;
      } else {
        delete config.modResults.UIBackgroundModes;
      }
    }

    return config;
  });
};
