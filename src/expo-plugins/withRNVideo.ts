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

  config = withNotificationControls(
    config,
    props.enableNotificationControls ?? false,
  );
  if (props.enableNotificationControls) {
    androidPermissions.push('android.permission.FOREGROUND_SERVICE');
    androidPermissions.push(
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    );
  }

  config = withAndroidPictureInPicture(
    config,
    props.enableAndroidPictureInPicture ?? false,
  );

  if (props.androidExtensions != null) {
    config = withAndroidExtensions(config, props.androidExtensions);
  }

  config = withAds(config, {
    enableADSExtension: props.enableADSExtension ?? false,
    testApp: props.reactNativeTestApp,
  });

  config = withCaching(config, {
    enableCachingExtension: props.enableCacheExtension ?? false,
    testApp: props.reactNativeTestApp,
  });

  config = withBackgroundAudio(config, props.enableBackgroundAudio ?? false);

  config = withPermissions(config, androidPermissions);

  return config;
};

export default createRunOncePlugin(withRNVideo, pkg.name, pkg.version);
