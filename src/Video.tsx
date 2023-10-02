import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ComponentRef,
} from "react";
import {
  View,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import NativeVideoComponent, { RCTVideoConstants } from "./VideoNativeComponent";
import type { NativeVideoResizeMode, OnAudioFocusChangedData, OnAudioTracksData, OnPlaybackStateChangedData, OnTextTracksData, OnTimedMetadataData, OnVideoErrorData, OnVideoTracksData } from './VideoNativeComponent'

import type { StyleProp, ImageStyle, NativeSyntheticEvent } from "react-native";
import {
  type VideoComponentType,
  type OnLoadData,
  type OnGetLicenseData,
  type OnLoadStartData,
  type OnProgressData,
  type OnSeekData,
  type OnPictureInPictureStatusChangedData,
  type OnBandwidthUpdateData,
  type OnBufferData,
  type OnExternalPlaybackChangeData,
  type OnReceiveAdEventData,
  VideoManager,
} from "./VideoNativeComponent";
import type { ReactVideoProps } from "./types/video";
import { getReactTag, resolveAssetSourceForVideo } from "./utils";

export interface VideoRef {
  seek: (time: number, tolerance?: number) => void;
  resume: () => void;
  pause: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  restoreUserInterfaceForPictureInPictureStopCompleted: (restore: boolean) => void;
}

const Video = forwardRef<VideoRef, ReactVideoProps>(
  (
    {
      source,
      style,
      resizeMode,
      posterResizeMode,
      poster,
      fullscreen,
      drm,
      textTracks,
      selectedAudioTrack,
      selectedTextTrack,
      onLoadStart,
      onLoad,
      onError,
      onProgress,
      onSeek,
      onEnd,
      onBuffer,
      onBandwidthUpdate,
      onExternalPlaybackChange,
      onFullscreenPlayerWillPresent,
      onFullscreenPlayerDidPresent,
      onFullscreenPlayerWillDismiss,
      onFullscreenPlayerDidDismiss,
      onReadyForDisplay,
      onPlaybackRateChange,
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
      onVideoTracks,
      ...rest
    },
    ref
  ) => {
    const nativeRef = useRef<ComponentRef<VideoComponentType>>(null);
    const [showPoster, setShowPoster] = useState(!!poster);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [
      _restoreUserInterfaceForPIPStopCompletionHandler,
      setRestoreUserInterfaceForPIPStopCompletionHandler,
    ] = useState<boolean | undefined>();

    const posterStyle = useMemo<StyleProp<ImageStyle>>(
      () => ({
        ...StyleSheet.absoluteFillObject,
        resizeMode:
          posterResizeMode && posterResizeMode !== "none"
            ? posterResizeMode
            : "contain",
      }),
      [posterResizeMode]
    );

    const src = useMemo(() => {
      const resolvedSource = resolveAssetSourceForVideo(source);
      let uri = resolvedSource.uri || "";
      if (uri && uri.match(/^\//)) uri = `file://${uri}`;
      if (!uri) console.warn("Trying to load empty source");
      const isNetwork = !!(uri && uri.match(/^https?:/));
      const isAsset = !!(
        uri &&
        uri.match(
          /^(assets-library|ipod-library|file|content|ms-appx|ms-appdata):/
        )
      );

      return {
        uri,
        isNetwork,
        isAsset,
        shouldCache: resolvedSource.shouldCache || false,
        type: resolvedSource.type || "",
        mainVer: resolvedSource.mainVer || 0,
        patchVer: resolvedSource.patchVer || 0,
        requestHeaders: resolvedSource?.headers || {},
        startTime: resolvedSource.startTime || 0,
        endTime: resolvedSource.endTime
      };
    }, [source]);

    const _resizeMode: NativeVideoResizeMode = useMemo(() => {
      switch (resizeMode) {
        case "contain":
          return RCTVideoConstants.ScaleAspectFit;
        case "cover":
          return RCTVideoConstants.ScaleAspectFill;
        case "stretch":
          return RCTVideoConstants.ScaleToFill;
        default:
          return RCTVideoConstants.ScaleNone;
      }
    }, [resizeMode]);

    const _drm = useMemo(() => {
      if (!drm) return;
      return {
        drmType: drm.type,
        licenseServer: drm.licenseServer,
        headers: drm.headers,
        contentId: drm.contentId,
        certificateUrl: drm.certificateUrl,
        base64Certificate: drm.base64Certificate,
        useExternalGetLicense: !!drm.getLicense,
      };
    }, [drm]);


    const _selectedTextTrack = useMemo(() => {
      if (!selectedTextTrack) return;
      if (typeof selectedTextTrack?.value === 'number') return {
        seletedTextType: selectedTextTrack?.type,
        index: selectedTextTrack?.value,
      }
      return {
        selectedTextType: selectedTextTrack?.type,
        value: selectedTextTrack?.value,
      }
    }, [selectedTextTrack]);

    const _selectedAudioTrack = useMemo(() => {
      if (!selectedAudioTrack) return;
      if (typeof selectedAudioTrack?.value === 'number') return {
        selectedAudioType: selectedAudioTrack?.type,
        index: selectedAudioTrack?.value,
      }
      return {
        selectedAudioType: selectedAudioTrack?.type,
        value: selectedAudioTrack?.value,
      }
    }, [selectedAudioTrack]);


    const seek = useCallback(
      async (time: number, tolerance?: number) => {
        if (isNaN(time)) throw new Error("Specified time is not a number");

        if (!nativeRef.current) {
          console.warn("Video Component is not mounted");
          return;
        }
        
        Platform.select({
          ios: () => {
            nativeRef.current?.setNativeProps({
              seek: {
                time,
                tolerance,
              },
            });
          },
          default: () => {
            nativeRef.current?.setNativeProps({
              seek: time,
            });
          },
        })();
      },
      []
    );

    const presentFullscreenPlayer = useCallback(() => {
      setIsFullscreen(true);
    }, [setIsFullscreen]);

    const dismissFullscreenPlayer = useCallback(() => {
      setIsFullscreen(false);
    }, [setIsFullscreen]);

    const save = useCallback(async () => {
      await VideoManager.save(getReactTag(nativeRef));
    }, []);

    const pause = useCallback(async () => {
      await VideoManager.setPlayerPauseState(true, getReactTag(nativeRef));
    }, []);

    const resume = useCallback(async () => {
      await VideoManager.setPlayerPauseState(false, getReactTag(nativeRef));
    }, []);

    const restoreUserInterfaceForPictureInPictureStopCompleted = useCallback(
      (restored: boolean) => {
        setRestoreUserInterfaceForPIPStopCompletionHandler(restored);
      },
      [setRestoreUserInterfaceForPIPStopCompletionHandler]
    );

    const onVideoLoadStart = useCallback(
      (e: NativeSyntheticEvent<OnLoadStartData>) => {
        onLoadStart?.(e.nativeEvent);
      },
      [onLoadStart]
    );

    const onVideoLoad = useCallback(
      (e: NativeSyntheticEvent<OnLoadData>) => {
        if (Platform.OS === "windows") setShowPoster(false);
        onLoad?.(e.nativeEvent);
      },
      [onLoad, setShowPoster]
    );

    const onVideoError = useCallback(
      (e: NativeSyntheticEvent<OnVideoErrorData>) => {
        onError?.(e.nativeEvent);
      },
      [onError]
    );

    const onVideoProgress = useCallback(
      (e: NativeSyntheticEvent<OnProgressData>) => {
        onProgress?.(e.nativeEvent);
      },
      [onProgress]
    );

    const onVideoSeek = useCallback(
      (e: NativeSyntheticEvent<OnSeekData>) => {
        onSeek?.(e.nativeEvent);
      },
      [onSeek]
    );

    // android only
    const onVideoPlaybackStateChanged = useCallback((e: NativeSyntheticEvent<OnPlaybackStateChangedData>) => {
      onPlaybackStateChanged?.(e.nativeEvent);
    }, [onPlaybackStateChanged])

    // android only
    const onVideoIdle = useCallback(() => {
      onIdle?.()
    }, [onIdle])

    const _onTimedMetadata = useCallback(
      (e: NativeSyntheticEvent<OnTimedMetadataData>) => {
        onTimedMetadata?.(e.nativeEvent);
      },
      [onTimedMetadata]
    );

    const _onAudioTracks = useCallback((e: NativeSyntheticEvent<OnAudioTracksData>) => {
      onAudioTracks?.(e.nativeEvent)
    }, [onAudioTracks])

    const _onTextTracks = useCallback((e: NativeSyntheticEvent<OnTextTracksData>) => {
      onTextTracks?.(e.nativeEvent)
    }, [onTextTracks])

    const _onVideoTracks = useCallback((e: NativeSyntheticEvent<OnVideoTracksData>) => {
      onVideoTracks?.(e.nativeEvent)
    }, [onVideoTracks])

    const _onPlaybackRateChange = useCallback(
      (e: NativeSyntheticEvent<Readonly<{ playbackRate: number }>>) => {
        onPlaybackRateChange?.(e.nativeEvent);
      },
      [onPlaybackRateChange]
    );

    const _onReadyForDisplay = useCallback(() => {
      setShowPoster(false);
      onReadyForDisplay?.();
    }, [setShowPoster, onReadyForDisplay]);

    const _onPictureInPictureStatusChanged = useCallback(
      (e: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>) => {
        onPictureInPictureStatusChanged?.(e.nativeEvent);
      },
      [onPictureInPictureStatusChanged]
    );

    const _onAudioFocusChanged = useCallback((e: NativeSyntheticEvent<OnAudioFocusChangedData>) => {
      onAudioFocusChanged?.(e.nativeEvent)
    }, [onAudioFocusChanged])

    const onVideoBuffer = useCallback((e: NativeSyntheticEvent<OnBufferData>) => {
      onBuffer?.(e.nativeEvent);
    }, [onBuffer]);

    const onVideoExternalPlaybackChange = useCallback((e: NativeSyntheticEvent<OnExternalPlaybackChangeData>) => {
      onExternalPlaybackChange?.(e.nativeEvent);
    }, [onExternalPlaybackChange])

    const _onBandwidthUpdate = useCallback((e: NativeSyntheticEvent<OnBandwidthUpdateData>) => {
      onBandwidthUpdate?.(e.nativeEvent);
    }, [onBandwidthUpdate]);

    const _onReceiveAdEvent = useCallback((e: NativeSyntheticEvent<OnReceiveAdEventData>) => {
      onReceiveAdEvent?.(e.nativeEvent);
    }, [onReceiveAdEvent]);

    const onGetLicense = useCallback(
      (event: NativeSyntheticEvent<OnGetLicenseData>) => {
        if (drm && drm.getLicense instanceof Function) {
          const data = event.nativeEvent;
          if (data && data.spcBase64) {
            const getLicenseOverride = drm.getLicense(data.spcBase64, data.contentId, data.licenseUrl);
            const getLicensePromise = Promise.resolve(getLicenseOverride); // Handles both scenarios, getLicenseOverride being a promise and not.
            getLicensePromise.then((result => {
              if (result !== undefined) {
                nativeRef.current && VideoManager.setLicenseResult(result, data.licenseUrl, getReactTag(nativeRef));
              } else {
                nativeRef.current && VideoManager.setLicenseResultError('Empty license result', data.licenseUrl, getReactTag(nativeRef));
              }
            })).catch(() => {
              nativeRef.current && VideoManager.setLicenseResultError('fetch error', data.licenseUrl, getReactTag(nativeRef));
            });
          } else {
            VideoManager.setLicenseResultError('No spc received', data.licenseUrl, getReactTag(nativeRef));
          }
        }
    },
      [drm]
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
      }),
      [
        seek,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        save,
        pause,
        resume,
        restoreUserInterfaceForPictureInPictureStopCompleted,
      ]
    );

    return (
      <View style={style}>
        <NativeVideoComponent
          ref={nativeRef}
          {...rest}
          src={src}
          drm={_drm}
          style={StyleSheet.absoluteFill}
          resizeMode={_resizeMode}
          fullscreen={isFullscreen}
          restoreUserInterfaceForPIPStopCompletionHandler={
            _restoreUserInterfaceForPIPStopCompletionHandler
          }
          textTracks={textTracks}
          selectedTextTrack={_selectedTextTrack}
          selectedAudioTrack={_selectedAudioTrack}
          onGetLicense={onGetLicense}
          onVideoLoad={onVideoLoad}
          onVideoLoadStart={onVideoLoadStart}
          onVideoError={onVideoError}
          onVideoProgress={onVideoProgress}
          onVideoSeek={onVideoSeek}
          onVideoEnd={onEnd}
          onVideoBuffer={onVideoBuffer}
          onVideoPlaybackStateChanged={onVideoPlaybackStateChanged}
          onBandwidthUpdate={_onBandwidthUpdate}
          onTimedMetadata={_onTimedMetadata}
          onAudioTracks={_onAudioTracks}
          onTextTracks={_onTextTracks}
          onVideoTracks={_onVideoTracks}
          onVideoFullscreenPlayerDidDismiss={onFullscreenPlayerDidDismiss}
          onVideoFullscreenPlayerDidPresent={onFullscreenPlayerDidPresent}
          onVideoFullscreenPlayerWillDismiss={onFullscreenPlayerWillDismiss}
          onVideoFullscreenPlayerWillPresent={onFullscreenPlayerWillPresent}
          onVideoExternalPlaybackChange={onVideoExternalPlaybackChange}
          onVideoIdle={onVideoIdle}
          onAudioFocusChanged={_onAudioFocusChanged}
          onReadyForDisplay={_onReadyForDisplay}
          onPlaybackRateChange={_onPlaybackRateChange}
          onVideoAudioBecomingNoisy={onAudioBecomingNoisy}
          onPictureInPictureStatusChanged={_onPictureInPictureStatusChanged}
          onRestoreUserInterfaceForPictureInPictureStop={
            onRestoreUserInterfaceForPictureInPictureStop
          }
          onReceiveAdEvent={_onReceiveAdEvent}
        />
        {showPoster ? (
          <Image style={posterStyle} source={{ uri: poster }} />
        ) : null}
      </View>
    );
  }
);

export default Video;