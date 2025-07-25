import { type ConfigPlugin } from '@expo/config-plugins';
/**
 * Sets whether to include the cache dependency to use cache on iOS with `react-native-video`.
 */
export declare const withCaching: ConfigPlugin<{
    enableCachingExtension: boolean;
    testApp?: boolean;
}>;
