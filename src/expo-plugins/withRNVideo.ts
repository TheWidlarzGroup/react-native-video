import {type ConfigPlugin, createRunOncePlugin} from '@expo/config-plugins';
import type {ConfigProps} from './@types';
import {withNotificationControls} from './withNotificationControls';
import {withAndroidExtensions} from './withAndroidExtensions';
import {withAds} from './withAds';
import {withBackgroundAudio} from './withBackgroundAudio';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

const withRNVideo: ConfigPlugin<ConfigProps> = (config, props = {}) => {
  if (props.enableNotificationControls) {
    config = withNotificationControls(config, props.enableNotificationControls);
  }

  if (props.androidExtensions != null) {
    config = withAndroidExtensions(config, props.androidExtensions);
  }

  if (props.enableADSExtension) {
    config = withAds(config, props.enableADSExtension);
  }

  if (props.enableBackgroundAudio) {
    config = withBackgroundAudio(config, props.enableBackgroundAudio);
  }

  return config;
};

export default createRunOncePlugin(withRNVideo, pkg.name, pkg.version);
