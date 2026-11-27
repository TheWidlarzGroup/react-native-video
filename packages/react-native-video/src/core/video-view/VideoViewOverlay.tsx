import * as React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
  type LayoutChangeEvent,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useEvent } from '../hooks/useEvent';
import type { VideoPlayerBase } from '../types/VideoPlayerBase';
import type { VideoViewOverlayProps } from './VideoViewProps';

/**
 * Whether the view needs the overlay that covers the video until the first frame.
 */
export const hasVideoViewOverlay = ({
  poster,
  renderLoader,
  shutterColor,
  hideShutterView,
}: VideoViewOverlayProps): boolean => {
  const hasPoster =
    typeof poster === 'string' ? poster.length > 0 : poster?.source != null;

  return (
    hasPoster ||
    renderLoader != null ||
    (shutterColor != null && hideShutterView !== true)
  );
};

const getPosterResizeMode = ({
  poster,
  posterResizeMode,
}: VideoViewOverlayProps): ImageResizeMode => {
  if (typeof poster === 'object' && poster.resizeMode) {
    return poster.resizeMode;
  }

  if (posterResizeMode && posterResizeMode !== 'none') {
    return posterResizeMode;
  }

  return 'contain';
};

// Web bundlers don't define `__DEV__` unless the app does, so it can't be read directly.
const isDev = () => typeof __DEV__ !== 'undefined' && __DEV__;
let didWarnAboutLoaderAndPoster = false;

// Touches go through to the video and its controls.
const NO_TOUCHES = { pointerEvents: 'none' } as const;
// The overlay as a sibling of the video view, placed over the video's frame.
const SIBLING_COVER = { position: 'absolute', pointerEvents: 'none' } as const;

interface VideoViewOverlayComponentProps extends VideoViewOverlayProps {
  player: VideoPlayerBase;
  /**
   * Whether the player already shows a frame in this view, so the overlay must not appear.
   * Read on mount and when the player changes.
   */
  isReadyToDisplay: (player: VideoPlayerBase) => boolean;
}

/**
 * Covers the video with the shutter color, the poster or a custom loader
 * from the moment a source starts loading until the video is ready to display.
 */
export const VideoViewOverlay = ({
  player,
  isReadyToDisplay,
  ...overlayProps
}: VideoViewOverlayComponentProps) => {
  const { poster, posterResizeMode, renderLoader, shutterColor } = overlayProps;
  const hideShutterView = overlayProps.hideShutterView === true;

  const [hidden, setHidden] = React.useState<{
    player: VideoPlayerBase;
    value: boolean;
  }>(() => ({ player, value: isReadyToDisplay(player) }));

  // A different player starts covered again, unless it already shows a frame.
  const isHidden =
    hidden.player === player ? hidden.value : isReadyToDisplay(player);

  useEvent(player, 'onLoadStart', () => {
    setHidden({ player, value: false });
  });
  useEvent(player, 'onReadyToDisplay', () => {
    setHidden({ player, value: true });
  });

  if (isHidden) {
    return null;
  }

  const resizeMode = getPosterResizeMode(overlayProps);
  // Explicit size: a bundled image otherwise keeps its own width and height.
  const posterStyle: StyleProp<ImageStyle> = [
    StyleSheet.absoluteFill,
    { width: '100%', height: '100%' },
    typeof poster === 'object' ? poster.style : undefined,
  ];

  let content: React.ReactNode = null;

  if (renderLoader != null) {
    if (
      isDev() &&
      !didWarnAboutLoaderAndPoster &&
      (poster != null || posterResizeMode != null)
    ) {
      didWarnAboutLoaderAndPoster = true;
      console.warn(
        '[ReactNativeVideo] You provided both `renderLoader` and `poster` or `posterResizeMode`. `renderLoader` will be used.'
      );
    }

    content =
      typeof renderLoader === 'function'
        ? renderLoader({ style: posterStyle, resizeMode })
        : renderLoader;
  } else if (typeof poster === 'string') {
    content = poster.length > 0 && (
      <Image
        source={{ uri: poster }}
        resizeMode={resizeMode}
        style={posterStyle}
      />
    );
  } else if (poster?.source != null) {
    content = (
      <Image
        {...poster}
        source={poster.source}
        resizeMode={resizeMode}
        style={posterStyle}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        NO_TOUCHES,
        !hideShutterView && shutterColor != null
          ? { backgroundColor: shutterColor }
          : undefined,
      ]}
    >
      {content}
    </View>
  );
};

interface VideoViewOverlayHostProps {
  /** The style and `onLayout` the app passed to `VideoView`. */
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Whether an overlay would be drawn for the current props. */
  hasOverlay: boolean;
  /**
   * Renders the native video view with the layout props it must use
   * (they replace the app's `style` and `onLayout`).
   */
  renderVideo: (layoutProps: {
    style?: StyleProp<ViewStyle>;
    onLayout?: (event: LayoutChangeEvent) => void;
  }) => React.ReactElement;
  renderOverlay: () => React.ReactElement;
}

/**
 * Puts the overlay over the native video view without ever recreating that view.
 *
 * React recreates a native view when the element above it changes type, so the tree
 * is chosen once, on mount, and kept:
 * - The view mounted with overlay props: a wrapper takes the app's style, the video and
 *   the overlay fill it. The wrapper stays when the props go away.
 * - The view mounted without them: the video is rendered alone, exactly as before these
 *   props existed. If overlay props show up later (a poster URL that arrives from an API),
 *   the overlay is added as a sibling and placed over the video's measured frame.
 */
export const VideoViewOverlayHost = ({
  style,
  onLayout,
  hasOverlay,
  renderVideo,
  renderOverlay,
}: VideoViewOverlayHostProps) => {
  const [isWrapped] = React.useState(hasOverlay);
  const frame = React.useRef<LayoutRectangle | null>(null);
  const [, setFrameVersion] = React.useState(0);

  const latest = React.useRef({ hasOverlay, onLayout });
  latest.current = { hasOverlay, onLayout };

  const trackFrame = React.useCallback((event: LayoutChangeEvent) => {
    frame.current = event.nativeEvent.layout;
    // Views that never get an overlay only remember the frame, they don't re-render.
    if (latest.current.hasOverlay) {
      setFrameVersion((version) => version + 1);
    }
    latest.current.onLayout?.(event);
  }, []);

  if (isWrapped) {
    return (
      <View style={style} onLayout={onLayout}>
        {renderVideo({ style: StyleSheet.absoluteFill, onLayout: undefined })}
        {hasOverlay ? renderOverlay() : null}
      </View>
    );
  }

  const { x, y, width, height } = frame.current ?? {};

  return (
    <>
      {renderVideo({ style, onLayout: trackFrame })}
      {hasOverlay && frame.current != null ? (
        <View style={[SIBLING_COVER, { left: x, top: y, width, height }]}>
          {renderOverlay()}
        </View>
      ) : null}
    </>
  );
};
