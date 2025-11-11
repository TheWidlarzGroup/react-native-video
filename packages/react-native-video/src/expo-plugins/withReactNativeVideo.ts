import { type ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigProps } from './@types';
import { getPackageInfo } from './getPackageInfo';
import { withAndroidExtensions } from './withAndroidExtensions';
import { withAndroidPictureInPicture } from './withAndroidPictureInPicture';
import { withBackgroundAudio } from './withBackgroundAudio';
import { withAndroidNotificationControls } from './withAndroidNotificationControls';

const withRNVideo: ConfigPlugin<ConfigProps> = (config, props = {}) => {
  if (props.enableAndroidPictureInPicture) {
    config = withAndroidPictureInPicture(
      config,
      props.enableAndroidPictureInPicture
    );
  }

  if (props.androidExtensions != null) {
    config = withAndroidExtensions(config, props.androidExtensions);
  }

  if (props.enableBackgroundAudio) {
    config = withBackgroundAudio(config, props.enableBackgroundAudio);
  }

  config = withAndroidNotificationControls(config);

  return config;
};

const { name, version } = getPackageInfo();

export default createRunOncePlugin(withRNVideo, name, version);
