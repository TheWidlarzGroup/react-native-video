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
  /**
   * The player to play the video - {@link VideoPlayer}
   */
  player: VideoPlayer;
  /**
   * The style of the video view - {@link ViewStyle}
   */
  style?: ViewStyle;
  /**
   * Whether to show the controls. Defaults to false.
   */
  controls?: boolean;
  /**
   * Whether to enable & show the picture in picture button in native controls. Defaults to false.
   */
  pictureInPicture?: boolean;
  /**
   * Whether to automatically enter picture in picture mode when the video is playing. Defaults to false.
   */
  autoEnterPictureInPicture?: boolean;
}

export interface VideoViewRef {
  /**
   * Enter fullscreen mode
   */
  enterFullscreen: () => void;
  /**
   * Exit fullscreen mode
   */
  exitFullscreen: () => void;
  /**
   * Enter picture in picture mode
   */
  enterPictureInPicture: () => void;
  /**
   * Exit picture in picture mode
   */
  exitPictureInPicture: () => void;
  /**
   * Check if picture in picture mode is supported
   * @returns true if picture in picture mode is supported, false otherwise
   */
  canEnterPictureInPicture: () => boolean;
}

let nitroIdCounter = 1;
const VideoViewViewManagerFactory =
  NitroModules.createHybridObject<VideoViewViewManagerFactory>(
    'VideoViewViewManagerFactory'
  );

const wrapNativeViewManagerFunction = <T,>(
  manager: VideoViewViewManager | null,
  func: (manager: VideoViewViewManager) => T
) => {
  try {
    if (manager === null) {
      throw new VideoError('view/not-found', 'View manager not found');
    }

    return func(manager);
  } catch (error) {
    throw tryParseNativeVideoError(error);
  }
};

/**
 * VideoView is a component that allows you to display a video from a {@link VideoPlayer}.
 * @param player - The player to play the video - {@link VideoPlayer}
 * @param controls - Whether to show the controls. Defaults to false.
 * @param style - The style of the video view - {@link ViewStyle}
 * @param pictureInPicture - Whether to show the picture in picture button. Defaults to false.
 * @param autoEnterPictureInPicture - Whether to automatically enter picture in picture mode
 * when the video is playing. Defaults to false.
 */
const VideoView = React.forwardRef<VideoViewRef, VideoViewProps>(
  (
    {
      player,
      controls = false,
      pictureInPicture = false,
      autoEnterPictureInPicture = false,
      ...props
    },
    ref
  ) => {
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
          nitroViewManager.current.controls = controls;
          nitroViewManager.current.pictureInPicture = pictureInPicture;
          nitroViewManager.current.autoEnterPictureInPicture =
            autoEnterPictureInPicture;
        } catch (error) {
          throw tryParseNativeVideoError(error);
        }
      },
      [player, controls, pictureInPicture, autoEnterPictureInPicture]
    );

    const onNitroIdChange = React.useCallback(
      (event: { nativeEvent: { nitroId: number } }) => {
        setupViewManager(event.nativeEvent.nitroId);
      },
      [setupViewManager]
    );

    React.useImperativeHandle(
      ref,
      () => ({
        enterFullscreen: () => {
          wrapNativeViewManagerFunction(nitroViewManager.current, (manager) => {
            manager.enterFullscreen();
          });
        },
        exitFullscreen: () => {
          wrapNativeViewManagerFunction(nitroViewManager.current, (manager) => {
            manager.exitFullscreen();
          });
        },
        enterPictureInPicture: () => {
          wrapNativeViewManagerFunction(nitroViewManager.current, (manager) => {
            manager.enterPictureInPicture();
          });
        },
        exitPictureInPicture: () => {
          wrapNativeViewManagerFunction(nitroViewManager.current, (manager) => {
            manager.exitPictureInPicture();
          });
        },
        canEnterPictureInPicture: () => {
          return wrapNativeViewManagerFunction(
            nitroViewManager.current,
            (manager) => {
              return manager.canEnterPictureInPicture();
            }
          );
        },
      }),
      []
    );

    React.useEffect(() => {
      if (!nitroViewManager.current) {
        return;
      }

      nitroViewManager.current.player = player.__getNativePlayer();
      nitroViewManager.current.controls = controls;
      nitroViewManager.current.pictureInPicture = pictureInPicture;
      nitroViewManager.current.autoEnterPictureInPicture =
        autoEnterPictureInPicture;
    }, [player, controls, pictureInPicture, autoEnterPictureInPicture]);

    return (
      <NativeVideoView
        nitroId={nitroId}
        onNitroIdChange={onNitroIdChange}
        {...props}
      />
    );
  }
);

export default VideoView;
