import {AppRegistry} from 'react-native';
import VideoPlayer from './VideoPlayer';
import {name as appName} from '../app.json';

console.log('appName', appName);
AppRegistry.registerComponent(appName, () => VideoPlayer);
