"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationControls = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withNotificationControls = (c, enableNotificationControls) => {
    return (0, config_plugins_1.withAndroidManifest)(c, (config) => {
        const manifest = config.modResults.manifest;
        if (!enableNotificationControls) {
            return config;
        }
        if (!manifest.application) {
            console.warn('AndroidManifest.xml is missing an <application> element - skipping adding notification controls related config.');
            return config;
        }
        // Add the service to the AndroidManifest.xml
        manifest.application.map((application) => {
            if (!application.service) {
                application.service = [];
            }
            // We check if the VideoPlaybackService is already defined in the AndroidManifest.xml
            // to prevent adding duplicate service entries. If the service exists, we will remove
            // it before adding the updated configuration to ensure there are no conflicts or redundant
            // service declarations in the manifest.
            const existingServiceIndex = application.service.findIndex((service) => service?.$?.['android:name'] ===
                'com.brentvatne.exoplayer.VideoPlaybackService');
            if (existingServiceIndex !== -1) {
                application.service.splice(existingServiceIndex, 1);
            }
            application.service.push({
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
            return application;
        });
        return config;
    });
};
exports.withNotificationControls = withNotificationControls;
//# sourceMappingURL=withNotificationControls.js.map