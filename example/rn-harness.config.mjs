const getRunners = () => {
  // This function can be expanded to dynamically fetch or configure runners
  if (process.env.CI) {
    return [
      {
        name: 'android',
        platform: 'android',
        deviceId: 'Pixel_8_API_35', // Your Android emulator name
        bundleId: 'com.twg.videoexample', // Your Android bundle ID
      },
      {
        name: 'ios',
        platform: 'ios',
        deviceId: 'iPhone 16 Pro', // Your iOS simulator name
        bundleId: 'com.twg.videoexample', // Your iOS bundle ID
        systemVersion: '18.6',
      },
    ];
  }

  return [
    {
      name: 'android',
      platform: 'android',
      deviceId: 'Android_10', // Your Android emulator name
      bundleId: 'com.twg.videoexample', // Your Android bundle ID
    },
    {
      name: 'ios',
      platform: 'ios',
      deviceId: 'iPhone 16 Pro', // Your iOS simulator name
      bundleId: 'com.twg.videoexample', // Your iOS bundle ID
      systemVersion: '26.0',
    },
  ];
};

const config = {
  entryPoint: './index.js',
  appRegistryComponentName: 'VideoExample',
  defaultRunner: 'android',

  runners: getRunners(),
};

export default config;
