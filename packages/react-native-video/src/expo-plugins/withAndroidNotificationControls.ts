import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';

const PLAYBACK_SERVICE =
  'com.twg.video.core.services.playback.VideoPlaybackService';
const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
];

export const withAndroidNotificationControls: ConfigPlugin = (oldConfig) => {
  return withAndroidManifest(oldConfig, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplication(
      config.modResults
    );
    if (!mainApplication) {
      console.warn(
        'AndroidManifest.xml is missing an <activity android:name=".MainActivity" /> element - skipping adding Notification Controls related config.'
      );
      return config;
    }
    // A manifest with no <service> element yet (the default Expo template) has no
    // `service` array at all, so it must be created rather than optionally pushed to.
    const services = (mainApplication.service ??= []);
    const alreadyAdded = services.some(
      (service) => service.$?.['android:name'] === PLAYBACK_SERVICE
    );
    if (!alreadyAdded) {
      services.push({
        '$': {
          'android:name': PLAYBACK_SERVICE,
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'androidx.media3.session.MediaSessionService',
                },
              },
            ],
          },
        ],
      });
    }

    // Write the permissions into the manifest itself. Adding them to
    // `config.android.permissions` from inside this mod is too late: `expo prebuild`
    // registers its own permissions mod after the app's plugins, so it runs first and
    // has already written the manifest by the time this mod changes the config.
    AndroidConfig.Permissions.ensurePermissions(config.modResults, PERMISSIONS);
    return config;
  });
};
