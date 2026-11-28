import {
  AndroidConfig,
  withAndroidManifest,
  type ConfigPlugin,
} from '@expo/config-plugins';

export const withAndroidPictureInPicture: ConfigPlugin<boolean> = (
  config,
  enableAndroidPictureInPicture,
) => {
  return withAndroidManifest(config, (_config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivity(
      _config.modResults,
    );

    if (!mainActivity) {
      if (enableAndroidPictureInPicture) {
        console.warn(
          'AndroidManifest.xml is missing an <activity android:name=".MainActivity" /> element - skipping adding Picture-In-Picture related config.',
        );
      }
      return _config;
    }

    if (enableAndroidPictureInPicture) {
      mainActivity.$['android:supportsPictureInPicture'] = 'true';
    } else {
      delete mainActivity.$['android:supportsPictureInPicture'];
    }

    return _config;
  });
};
