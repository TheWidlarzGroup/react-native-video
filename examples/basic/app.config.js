import {withRNVideo} from 'react-native-video';

const config = {
  name: 'VideoPlayer',
  displayName: 'VideoPlayer',
};

module.exports = withRNVideo(config, {
  enableNotificationControls: true,
  enableBackgroundAudio: true,
  enableADSExtension: true,
  androidExtensions: {
    useExoplayerRtsp: true,
    useExoplayerSmoothStreaming: true,
    useExoplayerDash: true,
    useExoplayerHls: true,
  },
});
