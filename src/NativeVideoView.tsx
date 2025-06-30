import {
  UIManager,
  Platform,
  // type ViewStyle,
  // type ViewProps,
} from 'react-native';

import VideoViewNativeComponent from './spec/fabric/VideoViewNativeComponent';

const LINKING_ERROR =
  `The package 'react-native-video' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// interface VideoProps extends ViewProps {
//   nitroId: number;
//   style?: ViewStyle;
// }

const ComponentName = 'VideoView';

export const NativeVideoView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? VideoViewNativeComponent
    : () => {
        throw new Error(LINKING_ERROR);
      };
