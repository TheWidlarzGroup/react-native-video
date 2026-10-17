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
 * Vega view: a w3cmedia surface that the player draws into. Fullscreen and picture in
 * picture do not exist on a TV, and there are no built-in controls, so those props do nothing.
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
    const appState = useKeplerAppStateManager();

    useEffect(() => {
      player.__setComponentInstance(() => appState.getComponentInstance());
      return () => player.__setComponentInstance(null);
    }, [player, appState]);

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

    // The surface outlives a player: a new source gives a new player, which takes it over.
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
