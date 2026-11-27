import type {ImageRequireSource} from 'react-native';
import type {ReactVideoProps, ReactVideoSource} from 'react-native-video';

declare const bundledVideo: ImageRequireSource;

export const directSource: ReactVideoSource = bundledVideo;
export const wrappedSource: ReactVideoSource = {uri: bundledVideo};
export const directSourceProps: ReactVideoProps = {source: bundledVideo};
export const wrappedSourceProps: ReactVideoProps = {
  source: {uri: bundledVideo},
};
