import * as React from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  SurfaceType,
  VideoViewViewManager,
  VideoViewViewManagerFactory,
} from '../../spec/nitro/VideoViewViewManager.nitro';
import type { VideoViewEvents } from '../types/Events';
import type { ResizeMode } from '../types/ResizeMode';
import { tryParseNativeVideoError, VideoError } from '../types/VideoError';
import type { VideoPlayer } from '../VideoPlayer';
import { NativeVideoView } from './NativeVideoView';

export interface VideoViewProps extends Partial<VideoViewEvents>, ViewProps {
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
  /**
   * How the video should be resized to fit the view. Defaults to 'none'.
   * - 'contain': Scale the video uniformly (maintain aspect ratio) so that it fits entirely within the view
   * - 'cover': Scale the video uniformly (maintain aspect ratio) so that it fills the entire view (may crop)
   * - 'stretch': Scale the video to fill the entire view without maintaining aspect ratio
   * - 'none': Do not resize the video
   */
  resizeMode?: ResizeMode;
  /**
   * Whether to keep the screen awake while the video view is mounted. Defaults to true.
   */
  keepScreenAwake?: boolean;

  /**
   * The type of underlying native view. Defaults to 'surface'.
   * - 'surface': Uses a SurfaceView on Android. More performant, but cannot be animated or transformed.
   * - 'texture': Uses a TextureView on Android. Less performant, but can be animated and transformed.
   *
   * Only applicable on Android
   *
   * @default 'surface'
   * @platform android
   */
  surfaceType?: SurfaceType;
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

const updateProps = (manager: VideoViewViewManager, props: VideoViewProps) => {
  manager.player = props.player.__getNativePlayer();
  manager.controls = props.controls ?? false;
  manager.pictureInPicture = props.pictureInPicture ?? false;
  manager.autoEnterPictureInPicture = props.autoEnterPictureInPicture ?? false;
  manager.resizeMode = props.resizeMode ?? 'none';
  manager.onPictureInPictureChange = props.onPictureInPictureChange;
  manager.onFullscreenChange = props.onFullscreenChange;
  manager.willEnterFullscreen = props.willEnterFullscreen;
  manager.willExitFullscreen = props.willExitFullscreen;
  manager.willEnterPictureInPicture = props.willEnterPictureInPicture;
  manager.willExitPictureInPicture = props.willExitPictureInPicture;
  manager.keepScreenAwake = props.keepScreenAwake ?? true;
  manager.surfaceType = props.surfaceType ?? 'surface';
};

/**
 * VideoView is a component that allows you to display a video from a {@link VideoPlayer}.
 *
 * @param player - The player to play the video - {@link VideoPlayer}
 * @param controls - Whether to show the controls. Defaults to false.
 * @param style - The style of the video view - {@link ViewStyle}
 * @param pictureInPicture - Whether to show the picture in picture button. Defaults to false.
 * @param autoEnterPictureInPicture - Whether to automatically enter picture in picture mode
 * when the video is playing. Defaults to false.
 * @param resizeMode - How the video should be resized to fit the view. Defaults to 'none'.
 */
const VideoView = React.forwardRef<VideoViewRef, VideoViewProps>(
  (
    {
      player,
      controls = false,
      pictureInPicture = false,
      autoEnterPictureInPicture = false,
      resizeMode = 'none',
      ...props
    },
    ref
  ) => {
    const nitroId = React.useMemo(() => nitroIdCounter++, []);
    const nitroViewManager = React.useRef<VideoViewViewManager | null>(null);

    const setupViewManager = React.useCallback(
      (id: number) => {
        try {
          if (nitroViewManager.current === null) {
            nitroViewManager.current =
              VideoViewViewManagerFactory.createViewManager(id);

            // Should never happen
            if (!nitroViewManager.current) {
              throw new VideoError(
                'view/not-found',
                'Failed to create View Manager'
              );
            }
          }

          // Updates props to native view
          updateProps(nitroViewManager.current, {
            ...props,
            player: player,
            controls: controls,
            pictureInPicture: pictureInPicture,
            autoEnterPictureInPicture: autoEnterPictureInPicture,
            resizeMode: resizeMode,
          });
        } catch (error) {
          throw tryParseNativeVideoError(error);
        }
      },
      [
        props,
        player,
        controls,
        pictureInPicture,
        autoEnterPictureInPicture,
        resizeMode,
      ]
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

      // Updates props to native view
      updateProps(nitroViewManager.current, {
        ...props,
        player: player,
        controls: controls,
        pictureInPicture: pictureInPicture,
        autoEnterPictureInPicture: autoEnterPictureInPicture,
        resizeMode: resizeMode,
      });
    }, [
      player,
      controls,
      pictureInPicture,
      autoEnterPictureInPicture,
      resizeMode,
      props,
    ]);

    return (
      <NativeVideoView
        nitroId={nitroId}
        onNitroIdChange={onNitroIdChange}
        {...props}
      />
    );
  }
);

VideoView.displayName = 'VideoView';

export default React.memo(VideoView);
