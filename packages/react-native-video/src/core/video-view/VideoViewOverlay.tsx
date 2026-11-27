import * as React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
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

let didWarnAboutLoaderAndPoster = false;

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
    { width: '100%', height: '100%', resizeMode },
    typeof poster === 'object' ? poster.style : undefined,
  ];

  let content: React.ReactNode = null;

  if (renderLoader != null) {
    if (
      __DEV__ &&
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
      <Image source={{ uri: poster }} style={posterStyle} />
    );
  } else if (poster?.source != null) {
    content = <Image {...poster} source={poster.source} style={posterStyle} />;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        !hideShutterView && shutterColor != null
          ? { backgroundColor: shutterColor }
          : undefined,
      ]}
    >
      {content}
    </View>
  );
};
