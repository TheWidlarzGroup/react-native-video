import { type ConfigPlugin } from '@expo/config-plugins';
/**
 * Sets `UIBackgroundModes` in `Info.plist` to enable background audio on Apple platforms.
 * This is required for audio to continue playing when the app is in the background.
 */
export declare const withBackgroundAudio: ConfigPlugin<boolean>;
