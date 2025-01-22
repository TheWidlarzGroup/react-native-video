import * as React from 'react';
import type { ViewStyle } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { VideoPlayer } from './spec/nitro/VideoPlayer.nitro';
import { NativeVideoView } from './NativeVideoView';
import type {
  VideoViewViewManager,
  VideoViewViewManagerFactory,
} from './spec/nitro/VideoViewViewManager.nitro';

interface VideoViewProps {
  player: VideoPlayer;
  style: ViewStyle;
}

let nitroIdCounter = 0;
const VideoViewViewManagerFactory =
  NitroModules.createHybridObject<VideoViewViewManagerFactory>(
    'VideoViewViewManagerFactory'
  );

const VideoView = ({ player, ...props }: VideoViewProps) => {
  const nitroId = React.useMemo(() => nitroIdCounter++, []);
  const nitroViewManager = React.useRef<VideoViewViewManager | null>(null);

  const setupViewManager = React.useCallback(
    (id: number) => {
      if (nitroViewManager.current !== null) {
        return;
      }

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
      setupViewManager(event.nativeEvent.nitroId);
    },
    [setupViewManager]
  );

  React.useEffect(() => {
    if (!nitroViewManager.current) {
      return;
    }

    nitroViewManager.current.player = player;
  }, [player]);

  return (
    <NativeVideoView
      nitroId={nitroId}
      onNitroIdChange={onNitroIdChange}
      {...props}
    />
  );
};

export default VideoView;
