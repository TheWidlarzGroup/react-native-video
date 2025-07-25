"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidExtensions = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Sets the Android extensions for ExoPlayer in `gradle.properties`.
 * You can choose which extensions to include in order to reduce the size of the app.
 */
const withAndroidExtensions = (c, androidExtensions) => {
    const keys = [
        'RNVideo_useExoplayerRtsp',
        'RNVideo_useExoplayerSmoothStreaming',
        'RNVideo_useExoplayerDash',
        'RNVideo_useExoplayerHls',
    ];
    if (!androidExtensions) {
        androidExtensions = {
            useExoplayerRtsp: false,
            useExoplayerSmoothStreaming: true,
            useExoplayerDash: true,
            useExoplayerHls: true,
        };
    }
    return (0, config_plugins_1.withGradleProperties)(c, (config) => {
        config.modResults = config.modResults.filter((item) => {
            if (item.type === 'property' && keys.includes(item.key)) {
                return false;
            }
            return true;
        });
        for (const key of keys) {
            const valueKey = key.replace('RNVideo_', '');
            const value = androidExtensions
                ? androidExtensions[valueKey] ?? false
                : false;
            config.modResults.push({
                type: 'property',
                key,
                value: value.toString(),
            });
        }
        return config;
    });
};
exports.withAndroidExtensions = withAndroidExtensions;
//# sourceMappingURL=withAndroidExtensions.js.map