import * as React from 'react';
import type { VideoPlayer } from './spec/nitro/VideoPlayer.nitro';
import { NativeVideoView } from './NativeVideoView';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoViewViewManager,
  VideoViewViewManagerFactory,
} from './spec/nitro/VideoViewViewManager.nitro';
import type { ViewStyle } from 'react-native';

interface VideoViewProps {
  player: VideoPlayer;
  style: ViewStyle;
}

let nitroIdCounter = 0;
const VideoViewViewManagerFactory =
  NitroModules.createHybridObject<VideoViewViewManagerFactory>(
    'VideoViewViewManagerFactory'
  );

const DEBUG = true;

const VideoView = ({ player, ...props }: VideoViewProps) => {
  const nitroId = React.useMemo(() => nitroIdCounter++, []);
  const nitroViewManager = React.useRef<VideoViewViewManager | null>(null);

  const setupViewManager = React.useCallback(
    (id: number) => {
      if (nitroViewManager.current !== null) {
        DEBUG && console.warn('View Manager already setup');
        return;
      }

      DEBUG && console.log('Setup View Manager');
      nitroViewManager.current =
        VideoViewViewManagerFactory.createViewManager(id);

      // Should never happen
      if (!nitroViewManager.current) {
        console.error('Failed to create View Manager');
        return;
      }

      // Updates props to native view
      nitroViewManager.current.player = player;
    },
    [player]
  );

  const onNitroIdChange = React.useCallback(
    (event: { nativeEvent: { nitroId: number } }) => {
      DEBUG && console.log('NitroId Change', event.nativeEvent.nitroId);
      setupViewManager(event.nativeEvent.nitroId);
    },
    [setupViewManager]
  );

  React.useEffect(() => {
    DEBUG && console.log('VideoView Mounted');

    return () => {
      DEBUG && console.log('VideoView Unmounted');
    };
  }, []);

  React.useEffect(() => {
    if (!nitroViewManager.current) {
      return;
    }

    DEBUG && console.log('Update View Manager Props');
    nitroViewManager.current.player = player;
  }, [player]);

  return (
    // TODO: It would be nice to be able to create Hybrid ViewManager before Component is mounted but after native props being set
    <NativeVideoView
      nitroId={nitroId}
      onNitroIdChange={onNitroIdChange}
      {...props}
    />
  );
};

export default VideoView;
