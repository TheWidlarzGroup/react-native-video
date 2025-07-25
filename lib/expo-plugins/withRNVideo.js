"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withNotificationControls_1 = require("./withNotificationControls");
const withAndroidExtensions_1 = require("./withAndroidExtensions");
const withAndroidPictureInPicture_1 = require("./withAndroidPictureInPicture");
const withAds_1 = require("./withAds");
const withBackgroundAudio_1 = require("./withBackgroundAudio");
const Permissions_1 = require("@expo/config-plugins/build/android/Permissions");
const withCaching_1 = require("./withCaching");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');
const withRNVideo = (config, props = {}) => {
    const androidPermissions = [];
    if (props.enableNotificationControls) {
        config = (0, withNotificationControls_1.withNotificationControls)(config, props.enableNotificationControls);
        androidPermissions.push('android.permission.FOREGROUND_SERVICE');
        androidPermissions.push('android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK');
    }
    if (props.enableAndroidPictureInPicture) {
        config = (0, withAndroidPictureInPicture_1.withAndroidPictureInPicture)(config, props.enableAndroidPictureInPicture);
    }
    if (props.androidExtensions != null) {
        config = (0, withAndroidExtensions_1.withAndroidExtensions)(config, props.androidExtensions);
    }
    if (props.enableADSExtension) {
        config = (0, withAds_1.withAds)(config, {
            enableADSExtension: props.enableADSExtension,
            testApp: props.reactNativeTestApp,
        });
    }
    if (props.enableCacheExtension) {
        config = (0, withCaching_1.withCaching)(config, {
            enableCachingExtension: props.enableCacheExtension,
            testApp: props.reactNativeTestApp,
        });
    }
    if (props.enableBackgroundAudio) {
        config = (0, withBackgroundAudio_1.withBackgroundAudio)(config, props.enableBackgroundAudio);
    }
    config = (0, Permissions_1.withPermissions)(config, androidPermissions);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withRNVideo, pkg.name, pkg.version);
//# sourceMappingURL=withRNVideo.js.map