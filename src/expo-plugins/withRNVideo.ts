import {type ConfigPlugin, createRunOncePlugin} from '@expo/config-plugins';
import type {ConfigProps} from './@types';
import {withNotificationControls} from './withNotificationControls';
import {withAndroidExtensions} from './withAndroidExtensions';
import {withAndroidPictureInPicture} from './withAndroidPictureInPicture';
import {withAds} from './withAds';
import {withBackgroundAudio} from './withBackgroundAudio';
import {withPermissions} from '@expo/config-plugins/build/android/Permissions';
import {withCaching} from './withCaching';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

const withRNVideo: ConfigPlugin<ConfigProps> = (config, props = {}) => {
  const androidPermissions = [];

  if (props.enableNotificationControls) {
    config = withNotificationControls(config, props.enableNotificationControls);
    androidPermissions.push('android.permission.FOREGROUND_SERVICE');
    androidPermissions.push(
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    );
  }

  if (props.enableAndroidPictureInPicture) {
    config = withAndroidPictureInPicture(
      config,
      props.enableAndroidPictureInPicture,
    );
  }

  if (props.androidExtensions != null) {
    config = withAndroidExtensions(config, props.androidExtensions);
  }

  if (props.enableADSExtension) {
    config = withAds(config, {
      enableADSExtension: props.enableADSExtension,
      testApp: props.reactNativeTestApp,
    });
  }

  if (props.enableCacheExtension) {
    config = withCaching(config, {
      enableCachingExtension: props.enableCacheExtension,
      testApp: props.reactNativeTestApp,
    });
  }

  if (props.enableBackgroundAudio) {
    config = withBackgroundAudio(config, props.enableBackgroundAudio);
  }

  config = withPermissions(config, androidPermissions);

  return config;
};

export default createRunOncePlugin(withRNVideo, pkg.name, pkg.version);
