import { type ConfigPlugin } from '@expo/config-plugins';
import type { ConfigProps } from './@types';
/**
 * Sets the Android extensions for ExoPlayer in `gradle.properties`.
 * You can choose which extensions to include in order to reduce the size of the app.
 */
export declare const withAndroidExtensions: ConfigPlugin<ConfigProps['androidExtensions']>;
