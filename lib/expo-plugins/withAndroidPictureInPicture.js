"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidPictureInPicture = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidPictureInPicture = (config, enableAndroidPictureInPicture) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (_config) => {
        if (!enableAndroidPictureInPicture) {
            return _config;
        }
        const mainActivity = config_plugins_1.AndroidConfig.Manifest.getMainActivity(_config.modResults);
        if (!mainActivity) {
            console.warn('AndroidManifest.xml is missing an <activity android:name=".MainActivity" /> element - skipping adding Picture-In-Picture related config.');
            return _config;
        }
        mainActivity.$['android:supportsPictureInPicture'] = 'true';
        return _config;
    });
};
exports.withAndroidPictureInPicture = withAndroidPictureInPicture;
//# sourceMappingURL=withAndroidPictureInPicture.js.map