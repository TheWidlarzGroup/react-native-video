import {withAndroidManifest, type ConfigPlugin} from '@expo/config-plugins';

export const withNotificationControls: ConfigPlugin<boolean> = (
  c,
  enableNotificationControls,
) => {
  return withAndroidManifest(c, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.application) {
      if (enableNotificationControls) {
        console.warn(
          'AndroidManifest.xml is missing an <application> element - skipping adding notification controls related config.',
        );
      }
      return config;
    }

    manifest.application.forEach((application) => {
      const services = (application.service ?? []).filter(
        (service) =>
          service?.$?.['android:name'] !==
          'com.brentvatne.exoplayer.VideoPlaybackService',
      );

      if (!enableNotificationControls) {
        if (services.length > 0) {
          application.service = services;
        } else {
          delete application.service;
        }
        return;
      }

      services.push({
        $: {
          'android:name': 'com.brentvatne.exoplayer.VideoPlaybackService',
          'android:exported': 'false',
          // @ts-expect-error: 'android:foregroundServiceType' does not exist in type 'ManifestServiceAttributes'.
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
      application.service = services;
    });

    return config;
  });
};
