"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAds = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const writeToPodfile_1 = require("./writeToPodfile");
/**
 * Sets whether to enable the IMA SDK to use ADS with `react-native-video`.
 */
const withAds = (c, { enableADSExtension, testApp = false }) => {
    const android_key = 'RNVideo_useExoplayerIMA';
    const ios_key = 'RNVideoUseGoogleIMA';
    // -------------------- ANDROID --------------------
    const configWithAndroid = (0, config_plugins_1.withGradleProperties)(c, (config) => {
        config.modResults = config.modResults.filter((item) => {
            if (item.type === 'property' && item.key === android_key) {
                return false;
            }
            return true;
        });
        config.modResults.push({
            type: 'property',
            key: android_key,
            value: enableADSExtension.toString(),
        });
        return config;
    });
    // -------------------- IOS --------------------
    const complectedConfig = (0, config_plugins_1.withDangerousMod)(configWithAndroid, [
        'ios',
        (config) => {
            (0, writeToPodfile_1.writeToPodfile)(config.modRequest.projectRoot, ios_key, enableADSExtension.toString(), testApp);
            return config;
        },
    ]);
    return complectedConfig;
};
exports.withAds = withAds;
//# sourceMappingURL=withAds.js.map