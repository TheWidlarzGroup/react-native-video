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

import NativeVideoComponent, {
  NativeCmcdConfiguration,
} from './specs/VideoNativeComponent';
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
import {ViewType, CmcdMode, VideoRef} from './types';
import type {
  OnLoadData,
  OnTextTracksData,
  OnReceiveAdEventData,
  ReactVideoProps,
  CmcdData,
  ReactVideoSource,
} from './types';

const Video = forwardRef<VideoRef, ReactVideoProps>(
  (
    {
      source,
      style,
      resizeMode,
      poster,
      posterResizeMode,
      renderLoader,
      contentStartTime,
      drm,
      textTracks,
      selectedVideoTrack,
      selectedAudioTrack,
      selectedTextTrack,
      useTextureView,
      useSecureView,
      viewType,
      shutterColor,
      adTagUrl,
      adLanguage,
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
      localSourceEncryptionKeyScheme,
      minLoadRetryCount,
      bufferConfig,
      ...rest
    },
    ref,
  ) => {
    const nativeRef = useRef<ElementRef<typeof NativeVideoComponent>>(null);

    const isPosterDeprecated = typeof poster === 'string';

    const _renderLoader = useMemo(
      () =>
        !renderLoader
          ? undefined
          : renderLoader instanceof Function
          ? renderLoader
          : () => renderLoader,
      [renderLoader],
    );

    const hasPoster = useMemo(() => {
      if (_renderLoader) {
        return true;
      }

      if (isPosterDeprecated) {
        return !!poster;
      }

      return !!poster?.source;
    }, [isPosterDeprecated, poster, _renderLoader]);

    const [showPoster, setShowPoster] = useState(hasPoster);

    const [
      _restoreUserInterfaceForPIPStopCompletionHandler,
      setRestoreUserInterfaceForPIPStopCompletionHandler,
    ] = useState<boolean | undefined>();

    const sourceToUnternalSource = useCallback(
      (_source?: ReactVideoSource) => {
        if (!_source) {
          return undefined;
        }

        const isLocalAssetFile =
          typeof _source === 'number' ||
          ('uri' in _source && typeof _source.uri === 'number') ||
          ('uri' in _source &&
            typeof _source.uri === 'string' &&
            (_source.uri.startsWith('file://') ||
              _source.uri.startsWith('content://') ||
              _source.uri.startsWith('.')));

        const resolvedSource = resolveAssetSourceForVideo(_source);
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
            /^(assets-library|ipod-library|file|content|ms-appx|ms-appdata|asset):/,
          )
        );

        const selectedDrm = _source.drm || drm;
        const _textTracks = _source.textTracks || textTracks;
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
              localSourceEncryptionKeyScheme:
                selectedDrm.localSourceEncryptionKeyScheme ||
                localSourceEncryptionKeyScheme,
            };

        let _cmcd: NativeCmcdConfiguration | undefined;
        if (Platform.OS === 'android' && source?.cmcd) {
          const cmcd = source.cmcd;

          if (typeof cmcd === 'boolean') {
            _cmcd = cmcd ? {mode: CmcdMode.MODE_QUERY_PARAMETER} : undefined;
          } else if (typeof cmcd === 'object' && !Array.isArray(cmcd)) {
            const createCmcdHeader = (property?: CmcdData) =>
              property ? generateHeaderForNative(property) : undefined;

            _cmcd = {
              mode: cmcd.mode ?? CmcdMode.MODE_QUERY_PARAMETER,
              request: createCmcdHeader(cmcd.request),
              session: createCmcdHeader(cmcd.session),
              object: createCmcdHeader(cmcd.object),
              status: createCmcdHeader(cmcd.status),
            };
          } else {
            throw new Error(
              'Invalid CMCD configuration: Expected a boolean or an object.',
            );
          }
        }

        const selectedContentStartTime =
          _source.contentStartTime || contentStartTime;

        const _ad =
          _source.ad ||
          (adTagUrl || adLanguage
            ? {adTagUrl: adTagUrl, adLanguage: adLanguage}
            : undefined);

        const _minLoadRetryCount =
          _source.minLoadRetryCount || minLoadRetryCount;

        const _bufferConfig = _source.bufferConfig || bufferConfig;
        return {
          uri,
          isNetwork,
          isAsset,
          isLocalAssetFile,
          shouldCache: resolvedSource.shouldCache || false,
          type: resolvedSource.type || '',
          mainVer: resolvedSource.mainVer || 0,
          patchVer: resolvedSource.patchVer || 0,
          requestHeaders: generateHeaderForNative(resolvedSource.headers),
          startPosition: resolvedSource.startPosition ?? -1,
          cropStart: resolvedSource.cropStart,
          cropEnd: resolvedSource.cropEnd,
          contentStartTime: selectedContentStartTime,
          metadata: resolvedSource.metadata,
          drm: _drm,
          ad: _ad,
          cmcd: _cmcd,
          textTracks: _textTracks,
          textTracksAllowChunklessPreparation:
            resolvedSource.textTracksAllowChunklessPreparation,
          minLoadRetryCount: _minLoadRetryCount,
          bufferConfig: _bufferConfig,
        };
      },
      [
        adLanguage,
        adTagUrl,
        contentStartTime,
        drm,
        localSourceEncryptionKeyScheme,
        minLoadRetryCount,
        source?.cmcd,
        textTracks,
        bufferConfig,
      ],
    );

    const src = useMemo<VideoSrc | undefined>(() => {
      return sourceToUnternalSource(source);
    }, [sourceToUnternalSource, source]);

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

    const setSource = useCallback(
      (_source?: ReactVideoSource) => {
        return NativeVideoManager.setSourceCmd(
          getReactTag(nativeRef),
          sourceToUnternalSource(_source),
        );
      },
      [sourceToUnternalSource],
    );

    const presentFullscreenPlayer = useCallback(
      () => setFullScreen(true),
      [setFullScreen],
    );

    const dismissFullscreenPlayer = useCallback(
      () => setFullScreen(false),
      [setFullScreen],
    );

    const enterPictureInPicture = useCallback(async () => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }

      const _enterPictureInPicture = () => {
        NativeVideoManager.enterPictureInPictureCmd(getReactTag(nativeRef));
      };

      Platform.select({
        ios: _enterPictureInPicture,
        android: _enterPictureInPicture,
        default: () => {},
      })();
    }, []);

    const exitPictureInPicture = useCallback(async () => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }

      const _exitPictureInPicture = () => {
        NativeVideoManager.exitPictureInPictureCmd(getReactTag(nativeRef));
      };

      Platform.select({
        ios: _exitPictureInPicture,
        android: _exitPictureInPicture,
        default: () => {},
      })();
    }, []);

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
        try {
          if (!data?.spcBase64) {
            throw new Error('No spc received');
          }
          // Handles both scenarios, getLicenseOverride being a promise and not.
          const license = await Promise.resolve(
            selectedDrm.getLicense(
              data.spcBase64,
              data.contentId,
              data.licenseUrl,
              data.loadedLicenseUrl,
            ),
          ).catch(() => {
            throw new Error('fetch error');
          });
          if (typeof license !== 'string') {
            throw Error('Empty license result');
          }
          if (nativeRef.current) {
            NativeVideoManager.setLicenseResultCmd(
              getReactTag(nativeRef),
              license,
              data.loadedLicenseUrl,
            );
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'fetch error';
          if (nativeRef.current) {
            NativeVideoManager.setLicenseResultErrorCmd(
              getReactTag(nativeRef),
              msg,
              data.loadedLicenseUrl,
            );
          }
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
        enterPictureInPicture,
        exitPictureInPicture,
        setSource,
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
        enterPictureInPicture,
        exitPictureInPicture,
        setSource,
      ],
    );

    const _viewType = useMemo(() => {
      const hasValidDrmProp =
        drm !== undefined && Object.keys(drm).length !== 0;

      const shallForceViewType =
        hasValidDrmProp && (viewType === ViewType.TEXTURE || useTextureView);

      if (useSecureView && useTextureView) {
        console.warn(
          'cannot use SecureView on texture view. please set useTextureView={false}',
        );
      }

      if (shallForceViewType) {
        console.warn(
          'cannot use DRM on texture view. please set useTextureView={false}',
        );
        return useSecureView ? ViewType.SURFACE_SECURE : ViewType.SURFACE;
      }

      if (viewType !== undefined && viewType !== null) {
        return viewType;
      }

      if (useSecureView) {
        return ViewType.SURFACE_SECURE;
      }

      if (useTextureView) {
        return ViewType.TEXTURE;
      }

      return ViewType.SURFACE;
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
      if (_renderLoader && (poster || posterResizeMode)) {
        console.warn(
          'You provided both `renderLoader` and `poster` or `posterResizeMode` props. `renderLoader` will be used.',
        );
      }

      // render loader
      if (_renderLoader) {
        return (
          <View style={StyleSheet.absoluteFill}>
            {_renderLoader({
              source: source,
              style: posterStyle,
              resizeMode: resizeMode,
            })}
          </View>
        );
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
      _renderLoader,
      showPoster,
      source,
      resizeMode,
    ]);

    const _style: StyleProp<ViewStyle> = useMemo(
      () => ({
        ...StyleSheet.absoluteFillObject,
      }),
      [],
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
