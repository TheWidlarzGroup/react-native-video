import { type ConfigPlugin } from '@expo/config-plugins';
/**
 * Sets whether to enable the IMA SDK to use ADS with `react-native-video`.
 */
export declare const withAds: ConfigPlugin<{
    enableADSExtension: boolean;
    testApp?: boolean;
}>;
