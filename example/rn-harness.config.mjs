import {
  androidPlatform,
  androidEmulator,
} from '@react-native-harness/platform-android';
import {
  applePlatform,
  appleSimulator,
} from '@react-native-harness/platform-apple';

const getRunners = () => {
  // This function can be expanded to dynamically fetch or configure runners
  if (process.env.CI) {
    return [
      androidPlatform({
        name: 'android',
        device: androidEmulator('Pixel_8_API_35'), // CI's emulator name
        bundleId: 'com.twg.videoexample', // CI's App bundle ID
      }),
      applePlatform({
        name: 'ios',
        simulator: appleSimulator('iPhone 16 Pro', '18.6'), // CI's iOS simulator name and version
        bundleId: 'com.twg.videoexample', // CI's iOS bundle ID
      }),
    ];
  }

  return [
    androidPlatform({
      name: 'android',
      device: androidEmulator('Android_10'), // Your Android emulator name
      bundleId: 'com.twg.videoexample', // Your Android bundle ID
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator('iPhone 16 Pro', '18.6'), // Your iOS simulator name and version
      bundleId: 'com.twg.videoexample', // Your iOS bundle ID
    }),
  ];
};

const config = {
  entryPoint: './index.js',
  appRegistryComponentName: 'VideoExample',
  defaultRunner: 'android',

  runners: getRunners(),
};

export default config;
