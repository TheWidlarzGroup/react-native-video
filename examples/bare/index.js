/**
 * @format
 */

import {AppRegistry} from 'react-native';
import MinimalApp from './App.minimal';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => MinimalApp);
