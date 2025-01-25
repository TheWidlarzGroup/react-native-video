/**
 * @format
 */

import {AppRegistry} from 'react-native';
import BasicExample from 'common/BasicExample';
import {name as appName} from './app.json';
import DRMExample from 'common/DRMExample';

AppRegistry.registerComponent(appName, () => BasicExample);
AppRegistry.registerComponent('DRMExample', () => DRMExample);
