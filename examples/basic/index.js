/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import VideoPlayer from './src/VideoPlayer';
import EmbedFullScreen from './src/EmbedFullScreen';

AppRegistry.registerComponent('BasicVideoPlayer', () => VideoPlayer);

if (Platform.OS === 'ios') {
  AppRegistry.registerComponent('EmbedFullScreen', () => EmbedFullScreen);
}
