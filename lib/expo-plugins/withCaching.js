"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCaching = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const writeToPodfile_1 = require("./writeToPodfile");
/**
 * Sets whether to include the cache dependency to use cache on iOS with `react-native-video`.
 */
const withCaching = (c, { enableCachingExtension, testApp = false }) => {
    const ios_key = 'RNVideoUseVideoCaching';
    return (0, config_plugins_1.withDangerousMod)(c, [
        'ios',
        (config) => {
            (0, writeToPodfile_1.writeToPodfile)(config.modRequest.projectRoot, ios_key, enableCachingExtension.toString(), testApp);
            return config;
        },
    ]);
};
exports.withCaching = withCaching;
//# sourceMappingURL=withCaching.js.map