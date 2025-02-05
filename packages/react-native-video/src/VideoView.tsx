import * as React from 'react';
import type { ViewStyle } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { tryParseNativeVideoError, VideoError } from './core/types/VideoError';
import type { VideoPlayer } from './core/VideoPlayer';
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
      try {
        if (nitroViewManager.current !== null) {
          return;
        }

        nitroViewManager.current =
          VideoViewViewManagerFactory.createViewManager(id);

        // Should never happen
        if (!nitroViewManager.current) {
          throw new VideoError(
            'view/not-found',
            'Failed to create View Manager'
          );
        }

        // Updates props to native view
        nitroViewManager.current.player = player.__getNativePlayer();
      } catch (error) {
        throw tryParseNativeVideoError(error);
      }
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

    nitroViewManager.current.player = player.__getNativePlayer();
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
