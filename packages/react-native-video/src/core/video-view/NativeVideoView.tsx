import { Platform, UIManager } from 'react-native';

import VideoViewNativeComponent from '../../spec/fabric/VideoViewNativeComponent';

const LINKING_ERROR =
  `The package 'react-native-video' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const ComponentName = 'VideoView';

export const NativeVideoView =
  UIManager.hasViewManagerConfig(ComponentName) != null
    ? VideoViewNativeComponent
    : () => {
        throw new Error(LINKING_ERROR);
      };
