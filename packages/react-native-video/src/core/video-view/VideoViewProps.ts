import type { ReactNode } from 'react';
import type {
  ColorValue,
  ImageProps,
  ImageRequireSource,
  ImageResizeMode,
  ImageStyle,
  ImageURISource,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { SurfaceType } from '../../spec/nitro/VideoViewViewManager.nitro';
import type { ControlsStyles } from '../types/ControlsStyles';
import type { ListenerSubscription } from '../types/EventEmitter';
import type { VideoViewEvents } from '../types/Events';
import type { FullscreenOrientation } from '../types/FullscreenOrientation';
import type { ResizeMode } from '../types/ResizeMode';
import type { SubtitleStyle } from '../types/SubtitleStyle';
import type { VideoPlayerBase } from '../types/VideoPlayerBase';

/**
 * The image shown before the first video frame. Takes every `Image` prop,
 * with a single `source`.
 */
export type VideoPoster = Omit<ImageProps, 'source'> & {
  source?: ImageURISource | ImageRequireSource;
};

export type VideoPosterResizeMode = ImageResizeMode | 'none';

export interface VideoLoaderProps {
  /**
   * Style that makes the loader fill the video view.
   */
  style: StyleProp<ImageStyle>;
  /**
   * The resize mode resolved from `poster.resizeMode` and `posterResizeMode`.
   */
  resizeMode: ImageResizeMode;
}

export interface VideoViewOverlayProps {
  /**
   * An image shown over the video from the moment a source starts loading
   * until the video is ready to display. Pass an image URL or `Image` props with a `source`.
   * For audio-only sources the poster stays visible.
   */
  poster?: string | VideoPoster;
  /**
   * How the poster is resized to fit the view. `poster.resizeMode` wins when both are set.
   * Defaults to 'contain'.
   */
  posterResizeMode?: VideoPosterResizeMode;
  /**
   * A custom view shown instead of the poster while the video loads.
   * Pass an element, or a function that receives a fill style and the poster resize mode.
   * When set, `poster` is ignored.
   */
  renderLoader?: ReactNode | ((props: VideoLoaderProps) => ReactNode);
  /**
   * The color that covers the video area until the video is ready to display.
   * It sits under the poster or loader. By default nothing covers the video.
   */
  shutterColor?: ColorValue;
  /**
   * Turns the shutter off, so `shutterColor` is ignored. Defaults to false.
   */
  hideShutterView?: boolean;
}

export interface VideoViewProps
  extends Partial<VideoViewEvents>, VideoViewOverlayProps, ViewProps {
  /**
   * The player to play the video
   */
  player: VideoPlayerBase;
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
   * - 'secureSurface': Uses a secure SurfaceView on Android. The video is left out of screenshots,
   *   screen recordings and non-secure displays (v6 `useSecureView`).
   *
   * Only applicable on Android
   *
   * @default 'surface'
   * @platform android
   */
  surfaceType?: SurfaceType;

  /**
   * Hides single elements of the native controls and chooses which system bars
   * are hidden in fullscreen. Has an effect only when `controls` is enabled
   * (the system bar options apply to fullscreen in general).
   *
   * Only applicable on Android
   *
   * @platform android
   */
  controlsStyles?: ControlsStyles;
  /**
   * The orientation of native fullscreen. Defaults to 'all'.
   * - 'all': fullscreen follows the device, in every orientation the app supports
   * - 'landscape': fullscreen opens in landscape
   * - 'portrait': fullscreen opens in portrait
   *
   * On iOS the app has to support the orientation (`UISupportedInterfaceOrientations`),
   * and the prop has no effect on iPad when the app supports multitasking (Split View).
   * On Android the activity is turned for the time fullscreen is open, and the value
   * is read when fullscreen opens.
   *
   * @default 'all'
   * @platform ios, android
   */
  fullscreenOrientation?: FullscreenOrientation;

  /**
   * Whether fullscreen may leave {@link fullscreenOrientation} when the user turns
   * the device. With `true`, fullscreen opens in that orientation and follows the
   * device once the user has turned it there. With `false`, fullscreen stays locked.
   * Ignored when `fullscreenOrientation` is 'all'.
   *
   * @default true
   * @platform ios, android
   */
  fullscreenAutorotate?: boolean;

  /**
   * Styling applied to the currently selected subtitle/caption track.
   * See {@link SubtitleStyle} for the available fields and their platform support.
   */
  subtitleStyle?: SubtitleStyle;
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
  /**
   * Adds a listener for a view event.
   * @param event - The event to add a listener for.
   * @param callback - The callback to call when the event is triggered.
   * @returns A subscription object that can be used to remove the listener.
   */
  addEventListener: <Event extends keyof VideoViewEvents>(
    event: Event,
    callback: VideoViewEvents[Event]
  ) => ListenerSubscription;
}
