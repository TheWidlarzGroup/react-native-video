/**
 * @format
 */

import {AppRegistry} from 'react-native';
import BasicExample from './src/BasicExample';
import {name as appName} from './app.json';
import DRMExample from './src/DRMExample';

AppRegistry.registerComponent(appName, () => BasicExample);
AppRegistry.registerComponent('DRMExample', () => DRMExample);
