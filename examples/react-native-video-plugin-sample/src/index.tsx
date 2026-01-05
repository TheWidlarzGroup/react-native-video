import {NativeModules, Platform} from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-video-plugin-sample' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const VideoPluginSample = NativeModules.VideoPluginSample
  ? NativeModules.VideoPluginSample
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

// Export your custom native methods here
// Example:
// export function customMethod(param: string): Promise<void> {
//   return VideoPluginSample.customMethod(param);
// }

export default VideoPluginSample;
