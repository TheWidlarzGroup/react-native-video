import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type {ElementRef} from 'react';
import {View, StyleSheet, Image, Platform, processColor} from 'react-native';
import type {
  StyleProp,
  ImageStyle,
  NativeSyntheticEvent,
  ViewStyle,
  ImageResizeMode,
} from 'react-native';

import NativeVideoComponent from './specs/VideoNativeComponent';
import type {
  OnAudioFocusChangedData,
  OnAudioTracksData,
  OnBandwidthUpdateData,
  OnBufferData,
  OnControlsVisibilityChange,
  OnExternalPlaybackChangeData,
  OnGetLicenseData,
  OnLoadStartData,
  OnPictureInPictureStatusChangedData,
  OnPlaybackStateChangedData,
  OnProgressData,
  OnSeekData,
  OnTextTrackDataChangedData,
  OnTimedMetadataData,
  OnVideoAspectRatioData,
  OnVideoErrorData,
  OnVideoTracksData,
  VideoSrc,
} from './specs/VideoNativeComponent';
import {
  generateHeaderForNative,
  getReactTag,
  resolveAssetSourceForVideo,
} from './utils';
import NativeVideoManager from './specs/NativeVideoManager';
import type {VideoSaveData} from './specs/NativeVideoManager';
import {ViewType} from './types';
import type {
  OnLoadData,
  OnTextTracksData,
  OnReceiveAdEventData,
  ReactVideoProps,
} from './types';

export interface VideoRef {
  seek: (time: number, tolerance?: number) => void;
  resume: () => void;
  pause: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  restoreUserInterfaceForPictureInPictureStopCompleted: (
    restore: boolean,
  ) => void;
  setVolume: (volume: number) => void;
  setFullScreen: (fullScreen: boolean) => void;
  save: (options: object) => Promise<VideoSaveData> | void;
  getCurrentPosition: () => Promise<number>;
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
      drm,
      textTracks,
      selectedVideoTrack,
      selectedAudioTrack,
      selectedTextTrack,
      useTextureView,
      useSecureView,
      viewType,
      shutterColor,
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
    const nativeRef = useRef<ElementRef<typeof NativeVideoComponent>>(null);

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

      const selectedDrm = source.drm || drm;
      const _drm = !selectedDrm
        ? undefined
        : {
            type: selectedDrm.type,
            licenseServer: selectedDrm.licenseServer,
            headers: generateHeaderForNative(selectedDrm.headers),
            contentId: selectedDrm.contentId,
            certificateUrl: selectedDrm.certificateUrl,
            base64Certificate: selectedDrm.base64Certificate,
            useExternalGetLicense: !!selectedDrm.getLicense,
            multiDrm: selectedDrm.multiDrm,
          };

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
        drm: _drm,
        textTracksAllowChunklessPreparation:
          resolvedSource.textTracksAllowChunklessPreparation,
      };
    }, [drm, source]);

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
        NativeVideoManager.seekCmd(
          getReactTag(nativeRef),
          time,
          tolerance || 0,
        );
      };

      Platform.select({
        ios: callSeekFunction,
        android: callSeekFunction,
        default: () => {
          // TODO: Implement VideoManager.seekCmd for windows
          nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const pause = useCallback(() => {
      return NativeVideoManager.setPlayerPauseStateCmd(
        getReactTag(nativeRef),
        true,
      );
    }, []);

    const resume = useCallback(() => {
      return NativeVideoManager.setPlayerPauseStateCmd(
        getReactTag(nativeRef),
        false,
      );
    }, []);

    const setVolume = useCallback((volume: number) => {
      return NativeVideoManager.setVolumeCmd(getReactTag(nativeRef), volume);
    }, []);

    const setFullScreen = useCallback((fullScreen: boolean) => {
      return NativeVideoManager.setFullScreenCmd(
        getReactTag(nativeRef),
        fullScreen,
      );
    }, []);

    const presentFullscreenPlayer = useCallback(
      () => setFullScreen(true),
      [setFullScreen],
    );

    const dismissFullscreenPlayer = useCallback(
      () => setFullScreen(false),
      [setFullScreen],
    );

    const save = useCallback((options: object) => {
      // VideoManager.save can be null on android & windows
      if (Platform.OS !== 'ios') {
        return;
      }
      // @todo Must implement it in a different way.
      return NativeVideoManager.save?.(getReactTag(nativeRef), options);
    }, []);

    const getCurrentPosition = useCallback(() => {
      // @todo Must implement it in a different way.
      return NativeVideoManager.getCurrentPosition(getReactTag(nativeRef));
    }, []);

    const restoreUserInterfaceForPictureInPictureStopCompleted = useCallback(
      (restored: boolean) => {
        setRestoreUserInterfaceForPIPStopCompletionHandler(restored);
      },
      [setRestoreUserInterfaceForPIPStopCompletionHandler],
    );

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

    const _shutterColor = useMemo(() => {
      const color = processColor(shutterColor);
      return typeof color === 'number' ? color : undefined;
    }, [shutterColor]);

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

    const selectedDrm = source?.drm || drm;
    const usingExternalGetLicense = selectedDrm?.getLicense instanceof Function;

    const onGetLicense = useCallback(
      async (event: NativeSyntheticEvent<OnGetLicenseData>) => {
        if (!usingExternalGetLicense) {
          return;
        }
        const data = event.nativeEvent;
        let result;
        if (data?.spcBase64) {
          try {
            // Handles both scenarios, getLicenseOverride being a promise and not.
            const license = await selectedDrm.getLicense(
              data.spcBase64,
              data.contentId,
              data.licenseUrl,
              data.loadedLicenseUrl,
            );
            if (typeof license === 'string') {
              if (nativeRef.current) {
                NativeVideoManager.setLicenseResultCmd(
                  getReactTag(nativeRef),
                  result,
                  data.loadedLicenseUrl,
                );
              }
              return;
            } else {
              result = 'Empty license result';
            } 
          } catch {
            result = 'fetch error';
          }
        } else {
          result = 'No spc received';
        }
        if (nativeRef.current) {
          NativeVideoManager.setLicenseResultErrorCmd(
            getReactTag(nativeRef),
            result,
            data.loadedLicenseUrl,
          );
        }
      },
      [selectedDrm, usingExternalGetLicense],
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
      if (!hasPoster || !showPoster) {
        return null;
      }

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
      if (renderLoader && (poster || posterResizeMode)) {
        console.warn(
          'You provided both `renderLoader` and `poster` or `posterResizeMode` props. `renderLoader` will be used.',
        );
      }

      // render loader
      if (renderLoader) {
        return <View style={StyleSheet.absoluteFill}>{renderLoader}</View>;
      }

      return (
        <Image
          {...(isPosterDeprecated ? {} : poster)}
          source={isPosterDeprecated ? {uri: poster} : poster?.source}
          style={posterStyle}
        />
      );
    }, [
      hasPoster,
      isPosterDeprecated,
      poster,
      posterResizeMode,
      renderLoader,
      showPoster,
    ]);

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
          style={_style}
          resizeMode={resizeMode}
          restoreUserInterfaceForPIPStopCompletionHandler={
            _restoreUserInterfaceForPIPStopCompletionHandler
          }
          textTracks={textTracks}
          selectedTextTrack={_selectedTextTrack}
          selectedAudioTrack={_selectedAudioTrack}
          selectedVideoTrack={_selectedVideoTrack}
          shutterColor={_shutterColor}
          onGetLicense={usingExternalGetLicense ? onGetLicense : undefined}
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
        {_renderPoster()}
      </View>
    );
  },
);

Video.displayName = 'Video';
export default Video;
