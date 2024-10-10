import {type ConfigPlugin, withDangerousMod} from '@expo/config-plugins';
import {writeToPodfile} from './writeToPodfile';

/**
 * Sets whether to include the cache dependency to use cache on iOS with `react-native-video`.
 */
export const withCaching: ConfigPlugin<{
  enableCachingExtension: boolean;
  testApp?: boolean;
}> = (c, {enableCachingExtension, testApp = false}) => {
  const ios_key = 'RNVideoUseVideoCaching';

  return withDangerousMod(c, [
    'ios',
    (config) => {
      writeToPodfile(
        config.modRequest.projectRoot,
        ios_key,
        enableCachingExtension.toString(),
        testApp,
      );
      return config;
    },
  ]);
};
