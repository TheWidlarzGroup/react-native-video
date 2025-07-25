"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBackgroundAudio = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Sets `UIBackgroundModes` in `Info.plist` to enable background audio on Apple platforms.
 * This is required for audio to continue playing when the app is in the background.
 */
const withBackgroundAudio = (c, enableBackgroundAudio) => {
    return (0, config_plugins_1.withInfoPlist)(c, (config) => {
        const modes = config.modResults.UIBackgroundModes || [];
        if (enableBackgroundAudio) {
            if (!modes.includes('audio')) {
                config.modResults.UIBackgroundModes = [...modes, 'audio'];
            }
        }
        else {
            config.modResults.UIBackgroundModes = modes.filter((mode) => mode !== 'audio');
        }
        return config;
    });
};
exports.withBackgroundAudio = withBackgroundAudio;
//# sourceMappingURL=withBackgroundAudio.js.map