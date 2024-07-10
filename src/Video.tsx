import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ComponentRef,
} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
  type StyleProp,
  type ImageStyle,
  type NativeSyntheticEvent,
  type ImageResizeMode,
  type ViewStyle,
} from 'react-native';

import NativeVideoComponent, {
  type OnAudioFocusChangedData,
  type OnAudioTracksData,
  type OnBandwidthUpdateData,
  type OnBufferData,
  type OnControlsVisibilityChange,
  type OnExternalPlaybackChangeData,
  type OnGetLicenseData,
  type OnLoadStartData,
  type OnPictureInPictureStatusChangedData,
  type OnPlaybackStateChangedData,
  type OnProgressData,
  type OnSeekData,
  type OnTextTrackDataChangedData,
  type OnTimedMetadataData,
  type OnVideoAspectRatioData,
  type OnVideoErrorData,
  type OnVideoTracksData,
  type VideoComponentType,
  type VideoSrc,
} from './specs/VideoNativeComponent';
import {
  generateHeaderForNative,
  getReactTag,
  resolveAssetSourceForVideo,
} from './utils';
import {VideoManager} from './specs/VideoNativeComponent';
import {
  type OnLoadData,
  type OnTextTracksData,
  type OnReceiveAdEventData,
  type ReactVideoProps,
  ViewType,
} from './types';

export type VideoSaveData = {
  uri: string;
};

export interface VideoRef {
  seek: (time: number, tolerance?: number) => void;
  resume: () => void;
  pause: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  restoreUserInterfaceForPictureInPictureStopCompleted: (
    restore: boolean,
  ) => void;
  save: (options: object) => Promise<VideoSaveData>;
  setVolume: (volume: number) => void;
  getCurrentPosition: () => Promise<number>;
  setFullScreen: (fullScreen: boolean) => void;
}

const Video = forwardRef<VideoRef, ReactVideoProps>(
  (
    {
      source,
      style,
      resizeMode,
      poster,
      posterResizeMode,
      renderLoader,
      fullscreen,
      drm,
      textTracks,
      selectedVideoTrack,
      selectedAudioTrack,
      selectedTextTrack,
      useTextureView,
      useSecureView,
      viewType,
      onLoadStart,
      onLoad,
      onError,
      onProgress,
      onSeek,
      onEnd,
      onBuffer,
      onBandwidthUpdate,
      onControlsVisibilityChange,
      onExternalPlaybackChange,
      onFullscreenPlayerWillPresent,
      onFullscreenPlayerDidPresent,
      onFullscreenPlayerWillDismiss,
      onFullscreenPlayerDidDismiss,
      onReadyForDisplay,
      onPlaybackRateChange,
      onVolumeChange,
      onAudioBecomingNoisy,
      onPictureInPictureStatusChanged,
      onRestoreUserInterfaceForPictureInPictureStop,
      onReceiveAdEvent,
      onPlaybackStateChanged,
      onAudioFocusChanged,
      onIdle,
      onTimedMetadata,
      onAudioTracks,
      onTextTracks,
      onTextTrackDataChanged,
      onVideoTracks,
      onAspectRatio,
      ...rest
    },
    ref,
  ) => {
    const nativeRef = useRef<ComponentRef<VideoComponentType>>(null);

    const isPosterDeprecated = typeof poster === 'string';

    const hasPoster = useMemo(() => {
      if (renderLoader) {
        return true;
      }

      if (isPosterDeprecated) {
        return !!poster;
      }

      return !!poster?.source;
    }, [isPosterDeprecated, poster, renderLoader]);

    const [showPoster, setShowPoster] = useState(hasPoster);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [
      _restoreUserInterfaceForPIPStopCompletionHandler,
      setRestoreUserInterfaceForPIPStopCompletionHandler,
    ] = useState<boolean | undefined>();

    const src = useMemo<VideoSrc | undefined>(() => {
      if (!source) {
        return undefined;
      }
      const resolvedSource = resolveAssetSourceForVideo(source);
      let uri = resolvedSource.uri || '';
      if (uri && uri.match(/^\//)) {
        uri = `file://${uri}`;
      }
      if (!uri) {
        console.log('Trying to load empty source');
      }
      const isNetwork = !!(uri && uri.match(/^(rtp|rtsp|http|https):/));
      const isAsset = !!(
        uri &&
        uri.match(
          /^(assets-library|ipod-library|file|content|ms-appx|ms-appdata):/,
        )
      );

      return {
        uri,
        isNetwork,
        isAsset,
        shouldCache: resolvedSource.shouldCache || false,
        type: resolvedSource.type || '',
        mainVer: resolvedSource.mainVer || 0,
        patchVer: resolvedSource.patchVer || 0,
        requestHeaders: generateHeaderForNative(resolvedSource.headers),
        startPosition: resolvedSource.startPosition ?? -1,
        cropStart: resolvedSource.cropStart || 0,
        cropEnd: resolvedSource.cropEnd,
        metadata: resolvedSource.metadata,
        textTracksAllowChunklessPreparation:
          resolvedSource.textTracksAllowChunklessPreparation,
      };
    }, [source]);

    const _drm = useMemo(() => {
      if (!drm) {
        return;
      }

      return {
        type: drm.type,
        licenseServer: drm.licenseServer,
        headers: generateHeaderForNative(drm.headers),
        contentId: drm.contentId,
        certificateUrl: drm.certificateUrl,
        base64Certificate: drm.base64Certificate,
        useExternalGetLicense: !!drm.getLicense,
      };
    }, [drm]);

    const _selectedTextTrack = useMemo(() => {
      if (!selectedTextTrack) {
        return;
      }
      const typeOfValueProp = typeof selectedTextTrack.value;
      if (
        typeOfValueProp !== 'number' &&
        typeOfValueProp !== 'string' &&
        typeOfValueProp !== 'undefined'
      ) {
        console.warn(
          'invalid type provided to selectedTextTrack.value: ',
          typeOfValueProp,
        );
        return;
      }
      return {
        type: selectedTextTrack?.type,
        value: `${selectedTextTrack.value}`,
      };
    }, [selectedTextTrack]);

    const _selectedAudioTrack = useMemo(() => {
      if (!selectedAudioTrack) {
        return;
      }
      const typeOfValueProp = typeof selectedAudioTrack.value;
      if (
        typeOfValueProp !== 'number' &&
        typeOfValueProp !== 'string' &&
        typeOfValueProp !== 'undefined'
      ) {
        console.warn(
          'invalid type provided to selectedAudioTrack.value: ',
          typeOfValueProp,
        );
        return;
      }

      return {
        type: selectedAudioTrack?.type,
        value: `${selectedAudioTrack.value}`,
      };
    }, [selectedAudioTrack]);

    const _selectedVideoTrack = useMemo(() => {
      if (!selectedVideoTrack) {
        return;
      }
      const typeOfValueProp = typeof selectedVideoTrack.value;
      if (
        typeOfValueProp !== 'number' &&
        typeOfValueProp !== 'string' &&
        typeOfValueProp !== 'undefined'
      ) {
        console.warn(
          'invalid type provided to selectedVideoTrack.value: ',
          typeOfValueProp,
        );
        return;
      }
      return {
        type: selectedVideoTrack?.type,
        value: `${selectedVideoTrack.value}`,
      };
    }, [selectedVideoTrack]);

    const seek = useCallback(async (time: number, tolerance?: number) => {
      if (isNaN(time) || time === null) {
        throw new Error("Specified time is not a number: '" + time + "'");
      }

      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }

      const callSeekFunction = () => {
        VideoManager.seek(
          {
            time,
            tolerance: tolerance || 0,
          },
          getReactTag(nativeRef),
        );
      };

      Platform.select({
        ios: callSeekFunction,
        android: callSeekFunction,
        default: () => {
          // TODO: Implement VideoManager.seek for windows
          nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const presentFullscreenPlayer = useCallback(() => {
      setIsFullscreen(true);
    }, [setIsFullscreen]);

    const dismissFullscreenPlayer = useCallback(() => {
      setIsFullscreen(false);
    }, [setIsFullscreen]);

    const save = useCallback((options: object) => {
      // VideoManager.save can be null on android & windows
      return VideoManager.save?.(options, getReactTag(nativeRef));
    }, []);

    const pause = useCallback(() => {
      return VideoManager.setPlayerPauseState(true, getReactTag(nativeRef));
    }, []);

    const resume = useCallback(() => {
      return VideoManager.setPlayerPauseState(false, getReactTag(nativeRef));
    }, []);

    const restoreUserInterfaceForPictureInPictureStopCompleted = useCallback(
      (restored: boolean) => {
        setRestoreUserInterfaceForPIPStopCompletionHandler(restored);
      },
      [setRestoreUserInterfaceForPIPStopCompletionHandler],
    );

    const setVolume = useCallback((volume: number) => {
      return VideoManager.setVolume(volume, getReactTag(nativeRef));
    }, []);

    const getCurrentPosition = useCallback(() => {
      return VideoManager.getCurrentPosition(getReactTag(nativeRef));
    }, []);

    const setFullScreen = useCallback((fullScreen: boolean) => {
      return VideoManager.setFullScreen(fullScreen, getReactTag(nativeRef));
    }, []);

    const onVideoLoadStart = useCallback(
      (e: NativeSyntheticEvent<OnLoadStartData>) => {
        hasPoster && setShowPoster(true);
        onLoadStart?.(e.nativeEvent);
      },
      [hasPoster, onLoadStart],
    );

    const onVideoLoad = useCallback(
      (e: NativeSyntheticEvent<OnLoadData>) => {
        if (Platform.OS === 'windows') {
          hasPoster && setShowPoster(false);
        }
        onLoad?.(e.nativeEvent);
      },
      [onLoad, hasPoster, setShowPoster],
    );

    const onVideoError = useCallback(
      (e: NativeSyntheticEvent<OnVideoErrorData>) => {
        onError?.(e.nativeEvent);
      },
      [onError],
    );

    const onVideoProgress = useCallback(
      (e: NativeSyntheticEvent<OnProgressData>) => {
        onProgress?.(e.nativeEvent);
      },
      [onProgress],
    );

    const onVideoSeek = useCallback(
      (e: NativeSyntheticEvent<OnSeekData>) => {
        onSeek?.(e.nativeEvent);
      },
      [onSeek],
    );

    const onVideoPlaybackStateChanged = useCallback(
      (e: NativeSyntheticEvent<OnPlaybackStateChangedData>) => {
        onPlaybackStateChanged?.(e.nativeEvent);
      },
      [onPlaybackStateChanged],
    );

    // android only
    const _onTimedMetadata = useCallback(
      (e: NativeSyntheticEvent<OnTimedMetadataData>) => {
        onTimedMetadata?.(e.nativeEvent);
      },
      [onTimedMetadata],
    );

    const _onAudioTracks = useCallback(
      (e: NativeSyntheticEvent<OnAudioTracksData>) => {
        onAudioTracks?.(e.nativeEvent);
      },
      [onAudioTracks],
    );

    const _onTextTracks = useCallback(
      (e: NativeSyntheticEvent<OnTextTracksData>) => {
        onTextTracks?.(e.nativeEvent);
      },
      [onTextTracks],
    );

    const _onTextTrackDataChanged = useCallback(
      (
        e: NativeSyntheticEvent<OnTextTrackDataChangedData & {target?: number}>,
      ) => {
        const {...eventData} = e.nativeEvent;
        delete eventData.target;
        onTextTrackDataChanged?.(eventData as OnTextTrackDataChangedData);
      },
      [onTextTrackDataChanged],
    );

    const _onVideoTracks = useCallback(
      (e: NativeSyntheticEvent<OnVideoTracksData>) => {
        onVideoTracks?.(e.nativeEvent);
      },
      [onVideoTracks],
    );

    const _onPlaybackRateChange = useCallback(
      (e: NativeSyntheticEvent<Readonly<{playbackRate: number}>>) => {
        onPlaybackRateChange?.(e.nativeEvent);
      },
      [onPlaybackRateChange],
    );

    const _onVolumeChange = useCallback(
      (e: NativeSyntheticEvent<Readonly<{volume: number}>>) => {
        onVolumeChange?.(e.nativeEvent);
      },
      [onVolumeChange],
    );

    const _onReadyForDisplay = useCallback(() => {
      hasPoster && setShowPoster(false);
      onReadyForDisplay?.();
    }, [setShowPoster, hasPoster, onReadyForDisplay]);

    const _onPictureInPictureStatusChanged = useCallback(
      (e: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>) => {
        onPictureInPictureStatusChanged?.(e.nativeEvent);
      },
      [onPictureInPictureStatusChanged],
    );

    const _onAudioFocusChanged = useCallback(
      (e: NativeSyntheticEvent<OnAudioFocusChangedData>) => {
        onAudioFocusChanged?.(e.nativeEvent);
      },
      [onAudioFocusChanged],
    );

    const onVideoBuffer = useCallback(
      (e: NativeSyntheticEvent<OnBufferData>) => {
        onBuffer?.(e.nativeEvent);
      },
      [onBuffer],
    );

    const onVideoExternalPlaybackChange = useCallback(
      (e: NativeSyntheticEvent<OnExternalPlaybackChangeData>) => {
        onExternalPlaybackChange?.(e.nativeEvent);
      },
      [onExternalPlaybackChange],
    );

    const _onBandwidthUpdate = useCallback(
      (e: NativeSyntheticEvent<OnBandwidthUpdateData>) => {
        onBandwidthUpdate?.(e.nativeEvent);
      },
      [onBandwidthUpdate],
    );

    const _onReceiveAdEvent = useCallback(
      (e: NativeSyntheticEvent<OnReceiveAdEventData>) => {
        onReceiveAdEvent?.(e.nativeEvent);
      },
      [onReceiveAdEvent],
    );

    const _onVideoAspectRatio = useCallback(
      (e: NativeSyntheticEvent<OnVideoAspectRatioData>) => {
        onAspectRatio?.(e.nativeEvent);
      },
      [onAspectRatio],
    );

    const _onControlsVisibilityChange = useCallback(
      (e: NativeSyntheticEvent<OnControlsVisibilityChange>) => {
        onControlsVisibilityChange?.(e.nativeEvent);
      },
      [onControlsVisibilityChange],
    );

    const useExternalGetLicense = drm?.getLicense instanceof Function;

    const onGetLicense = useCallback(
      (event: NativeSyntheticEvent<OnGetLicenseData>) => {
        if (useExternalGetLicense) {
          const data = event.nativeEvent;
          if (data && data.spcBase64) {
            const getLicenseOverride = drm.getLicense(
              data.spcBase64,
              data.contentId,
              data.licenseUrl,
              data.loadedLicenseUrl,
            );
            const getLicensePromise = Promise.resolve(getLicenseOverride); // Handles both scenarios, getLicenseOverride being a promise and not.
            getLicensePromise
              .then((result) => {
                if (result !== undefined) {
                  nativeRef.current &&
                    VideoManager.setLicenseResult(
                      result,
                      data.loadedLicenseUrl,
                      getReactTag(nativeRef),
                    );
                } else {
                  nativeRef.current &&
                    VideoManager.setLicenseResultError(
                      'Empty license result',
                      data.loadedLicenseUrl,
                      getReactTag(nativeRef),
                    );
                }
              })
              .catch(() => {
                nativeRef.current &&
                  VideoManager.setLicenseResultError(
                    'fetch error',
                    data.loadedLicenseUrl,
                    getReactTag(nativeRef),
                  );
              });
          } else {
            VideoManager.setLicenseResultError(
              'No spc received',
              data.loadedLicenseUrl,
              getReactTag(nativeRef),
            );
          }
        }
      },
      [drm, useExternalGetLicense],
    );

    useImperativeHandle(
      ref,
      () => ({
        seek,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        save,
        pause,
        resume,
        restoreUserInterfaceForPictureInPictureStopCompleted,
        setVolume,
        getCurrentPosition,
        setFullScreen,
      }),
      [
        seek,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        save,
        pause,
        resume,
        restoreUserInterfaceForPictureInPictureStopCompleted,
        setVolume,
        getCurrentPosition,
        setFullScreen,
      ],
    );

    const _viewType = useMemo(() => {
      const hasValidDrmProp =
        drm !== undefined && Object.keys(drm).length !== 0;

      const shallForceViewType =
        hasValidDrmProp && (viewType === ViewType.TEXTURE || useTextureView);

      if (shallForceViewType) {
        console.warn(
          'cannot use DRM on texture view. please set useTextureView={false}',
        );
      }
      if (useSecureView && useTextureView) {
        console.warn(
          'cannot use SecureView on texture view. please set useTextureView={false}',
        );
      }

      return shallForceViewType
        ? useSecureView
          ? ViewType.SURFACE_SECURE
          : ViewType.SURFACE // check if we should force the type to Surface due to DRM
        : viewType
        ? viewType // else use ViewType from source
        : useSecureView // else infer view type from useSecureView and useTextureView
        ? ViewType.SURFACE_SECURE
        : useTextureView
        ? ViewType.TEXTURE
        : ViewType.SURFACE;
    }, [drm, useSecureView, useTextureView, viewType]);

    const _renderPoster = useCallback(() => {
      // poster resize mode
      let _posterResizeMode: ImageResizeMode = 'contain';

      if (!isPosterDeprecated && poster?.resizeMode) {
        _posterResizeMode = poster.resizeMode;
      } else if (posterResizeMode && posterResizeMode !== 'none') {
        _posterResizeMode = posterResizeMode;
      }

      // poster style
      const baseStyle: StyleProp<ImageStyle> = {
        ...StyleSheet.absoluteFillObject,
        resizeMode: _posterResizeMode,
      };

      let posterStyle: StyleProp<ImageStyle> = baseStyle;

      if (!isPosterDeprecated && poster?.style) {
        const styles = Array.isArray(poster.style)
          ? poster.style
          : [poster.style];
        posterStyle = [baseStyle, ...styles];
      }

      // render poster
      if (renderLoader && poster) {
        console.warn(
          'You provided both `renderLoader` and `poster` props. `Poster` props is ignored.',
        );
      }

      if (renderLoader) {
        // check if valid jsx
        if (React.isValidElement(renderLoader)) {
          console.warn(
            'Invalid renderLoader component. Please provide a valid JSX component',
          );
          return;
        }

        return <View style={StyleSheet.absoluteFill}>{renderLoader}</View>;
      }

      return (
        <Image
          {...(isPosterDeprecated ? {} : poster)}
          source={isPosterDeprecated ? {uri: poster} : poster?.source}
          style={posterStyle}
        />
      );
    }, [isPosterDeprecated, poster, posterResizeMode, renderLoader]);

    const _style: StyleProp<ViewStyle> = useMemo(
      () => ({
        ...StyleSheet.absoluteFillObject,
        ...(showPoster ? {display: 'none'} : {}),
      }),
      [showPoster],
    );

    return (
      <View style={style}>
        <NativeVideoComponent
          ref={nativeRef}
          {...rest}
          src={src}
          drm={_drm}
          style={_style}
          resizeMode={resizeMode}
          fullscreen={isFullscreen}
          restoreUserInterfaceForPIPStopCompletionHandler={
            _restoreUserInterfaceForPIPStopCompletionHandler
          }
          textTracks={textTracks}
          selectedTextTrack={_selectedTextTrack}
          selectedAudioTrack={_selectedAudioTrack}
          selectedVideoTrack={_selectedVideoTrack}
          onGetLicense={useExternalGetLicense ? onGetLicense : undefined}
          onVideoLoad={
            onLoad || hasPoster
              ? (onVideoLoad as (e: NativeSyntheticEvent<object>) => void)
              : undefined
          }
          onVideoLoadStart={
            onLoadStart || hasPoster ? onVideoLoadStart : undefined
          }
          onVideoError={onError ? onVideoError : undefined}
          onVideoProgress={onProgress ? onVideoProgress : undefined}
          onVideoSeek={onSeek ? onVideoSeek : undefined}
          onVideoEnd={onEnd}
          onVideoBuffer={onBuffer ? onVideoBuffer : undefined}
          onVideoPlaybackStateChanged={
            onPlaybackStateChanged ? onVideoPlaybackStateChanged : undefined
          }
          onVideoBandwidthUpdate={
            onBandwidthUpdate ? _onBandwidthUpdate : undefined
          }
          onTimedMetadata={onTimedMetadata ? _onTimedMetadata : undefined}
          onAudioTracks={onAudioTracks ? _onAudioTracks : undefined}
          onTextTracks={onTextTracks ? _onTextTracks : undefined}
          onTextTrackDataChanged={
            onTextTrackDataChanged ? _onTextTrackDataChanged : undefined
          }
          onVideoTracks={onVideoTracks ? _onVideoTracks : undefined}
          onVideoFullscreenPlayerDidDismiss={onFullscreenPlayerDidDismiss}
          onVideoFullscreenPlayerDidPresent={onFullscreenPlayerDidPresent}
          onVideoFullscreenPlayerWillDismiss={onFullscreenPlayerWillDismiss}
          onVideoFullscreenPlayerWillPresent={onFullscreenPlayerWillPresent}
          onVideoExternalPlaybackChange={
            onExternalPlaybackChange ? onVideoExternalPlaybackChange : undefined
          }
          onVideoIdle={onIdle}
          onAudioFocusChanged={
            onAudioFocusChanged ? _onAudioFocusChanged : undefined
          }
          onReadyForDisplay={
            onReadyForDisplay || hasPoster ? _onReadyForDisplay : undefined
          }
          onPlaybackRateChange={
            onPlaybackRateChange ? _onPlaybackRateChange : undefined
          }
          onVolumeChange={onVolumeChange ? _onVolumeChange : undefined}
          onVideoAudioBecomingNoisy={onAudioBecomingNoisy}
          onPictureInPictureStatusChanged={
            onPictureInPictureStatusChanged
              ? _onPictureInPictureStatusChanged
              : undefined
          }
          onRestoreUserInterfaceForPictureInPictureStop={
            onRestoreUserInterfaceForPictureInPictureStop
          }
          onVideoAspectRatio={onAspectRatio ? _onVideoAspectRatio : undefined}
          onReceiveAdEvent={
            onReceiveAdEvent
              ? (_onReceiveAdEvent as (e: NativeSyntheticEvent<object>) => void)
              : undefined
          }
          onControlsVisibilityChange={
            onControlsVisibilityChange ? _onControlsVisibilityChange : undefined
          }
          viewType={_viewType}
        />
        {hasPoster && showPoster ? _renderPoster() : null}
      </View>
    );
  },
);

Video.displayName = 'Video';
export default Video;
