import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { KeplerVideoSurfaceView } from '@amazon-devices/react-native-w3cmedia';
import { useKeplerAppStateManager } from '@amazon-devices/react-native-kepler';
import type { VideoPlayer } from '../VideoPlayer.kepler';
import type { VideoViewProps, VideoViewRef } from './VideoViewProps';

const SCALING_MODE = {
  contain: 'fit',
  cover: 'fill',
  stretch: 'strech', // sic: w3cmedia's spelling
  none: 'fit',
} as const;

/**
 * Vega view: a w3cmedia surface the player draws into.
 * Fullscreen, picture in picture and controls props are no-ops on TV.
 */
const VideoView = forwardRef<VideoViewRef, VideoViewProps>(
  (
    {
      player: nPlayer,
      resizeMode = 'none',
      controls: _controls = false,
      pictureInPicture: _pip = false,
      autoEnterPictureInPicture: _autoPip = false,
      keepScreenAwake: _keepAwake = true,
      surfaceType: _surfaceType,
      onFullscreenChange: _onFullscreenChange,
      onPictureInPictureChange: _onPictureInPictureChange,
      willEnterFullscreen: _willEnterFullscreen,
      willExitFullscreen: _willExitFullscreen,
      willEnterPictureInPicture: _willEnterPictureInPicture,
      willExitPictureInPicture: _willExitPictureInPicture,
      ...props
    },
    ref
  ) => {
    const player = nPlayer as unknown as VideoPlayer;
    // A ref: the hook may return a new object on every render.
    const appState = useRef(useKeplerAppStateManager());

    useEffect(() => {
      const manager = appState.current;
      player.__setComponentInstance(() => manager.getComponentInstance());
      const subscription = manager.addAppStateListener('change', (state) =>
        player.__onAppStateChange(state)
      );
      return () => {
        subscription.remove();
        player.__setComponentInstance(null);
      };
    }, [player]);

    useImperativeHandle(
      ref,
      () => ({
        enterFullscreen: () => {},
        exitFullscreen: () => {},
        enterPictureInPicture: () => {},
        exitPictureInPicture: () => {},
        canEnterPictureInPicture: () => false,
        addEventListener: () => ({ remove: () => {} }),
      }),
      []
    );

    // A new source creates a new player, which takes over this surface.
    const surface = useRef<string | null>(null);
    const current = useRef(player);
    current.current = player;

    useEffect(() => {
      if (surface.current !== null) player.__attachSurface(surface.current);
      return () => {
        if (surface.current !== null) player.__detachSurface(surface.current);
      };
    }, [player]);

    const onCreated = useCallback((handle: string) => {
      surface.current = handle;
      current.current.__attachSurface(handle);
    }, []);
    const onDestroyed = useCallback((handle: string) => {
      surface.current = null;
      current.current.__detachSurface(handle);
    }, []);

    return (
      <View {...props}>
        <KeplerVideoSurfaceView
          style={StyleSheet.absoluteFillObject}
          scalingmode={SCALING_MODE[resizeMode] ?? 'fit'}
          onSurfaceViewCreated={onCreated}
          onSurfaceViewDestroyed={onDestroyed}
        />
      </View>
    );
  }
);

VideoView.displayName = 'VideoView';

export default memo(VideoView);
