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
  // The permissions go through Expo's own helper, at plugin level: it adds them to
  // `config.android.permissions` right away (so Expo's built-in permissions mod writes them
  // whenever it runs) and registers a manifest mod of its own. Adding them from inside the
  // manifest mod below is too late: `expo prebuild` registers its built-in mods after the
  // app's plugins and runs the last-registered first, so the permissions would never reach
  // AndroidManifest.xml.
  const withPermissions = AndroidConfig.Permissions.withPermissions(
    oldConfig,
    PERMISSIONS
  );

  return withAndroidManifest(withPermissions, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplication(
      config.modResults
    );
    if (!mainApplication) {
      console.warn(
        'AndroidManifest.xml is missing an <application android:name=".MainApplication"> element - skipping adding Notification Controls related config.'
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

    return config;
  });
};
