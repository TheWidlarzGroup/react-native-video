"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const VideoNativeComponent_1 = __importDefault(require("./specs/VideoNativeComponent"));
const utils_1 = require("./utils");
const NativeVideoManager_1 = __importDefault(require("./specs/NativeVideoManager"));
const types_1 = require("./types");
const Video = (0, react_1.forwardRef)(({ source, style, resizeMode, poster, posterResizeMode, renderLoader, contentStartTime, drm, textTracks, selectedVideoTrack, selectedAudioTrack, selectedTextTrack, useTextureView, useSecureView, viewType, shutterColor, adTagUrl, adLanguage, onLoadStart, onLoad, onError, onProgress, onSeek, onEnd, onBuffer, onBandwidthUpdate, onControlsVisibilityChange, onExternalPlaybackChange, onFullscreenPlayerWillPresent, onFullscreenPlayerDidPresent, onFullscreenPlayerWillDismiss, onFullscreenPlayerDidDismiss, onReadyForDisplay, onPlaybackRateChange, onVolumeChange, onAudioBecomingNoisy, onPictureInPictureStatusChanged, onRestoreUserInterfaceForPictureInPictureStop, onReceiveAdEvent, onPlaybackStateChanged, onAudioFocusChanged, onIdle, onTimedMetadata, onAudioTracks, onTextTracks, onTextTrackDataChanged, onVideoTracks, onAspectRatio, localSourceEncryptionKeyScheme, minLoadRetryCount, bufferConfig, ...rest }, ref) => {
    const nativeRef = (0, react_1.useRef)(null);
    const isPosterDeprecated = typeof poster === 'string';
    const _renderLoader = (0, react_1.useMemo)(() => !renderLoader
        ? undefined
        : renderLoader instanceof Function
            ? renderLoader
            : () => renderLoader, [renderLoader]);
    const hasPoster = (0, react_1.useMemo)(() => {
        if (_renderLoader) {
            return true;
        }
        if (isPosterDeprecated) {
            return !!poster;
        }
        return !!poster?.source;
    }, [isPosterDeprecated, poster, _renderLoader]);
    const [showPoster, setShowPoster] = (0, react_1.useState)(hasPoster);
    const [_restoreUserInterfaceForPIPStopCompletionHandler, setRestoreUserInterfaceForPIPStopCompletionHandler,] = (0, react_1.useState)();
    const sourceToUnternalSource = (0, react_1.useCallback)((_source) => {
        if (!_source) {
            return undefined;
        }
        const isLocalAssetFile = typeof _source === 'number' ||
            ('uri' in _source && typeof _source.uri === 'number') ||
            ('uri' in _source &&
                typeof _source.uri === 'string' &&
                (_source.uri.startsWith('file://') ||
                    _source.uri.startsWith('content://') ||
                    _source.uri.startsWith('.')));
        const resolvedSource = (0, utils_1.resolveAssetSourceForVideo)(_source);
        let uri = resolvedSource.uri || '';
        if (uri && uri.match(/^\//)) {
            uri = `file://${uri}`;
        }
        if (!uri) {
            console.log('Trying to load empty source');
        }
        const isNetwork = !!(uri && uri.match(/^(rtp|rtsp|http|https):/));
        const isAsset = !!(uri &&
            uri.match(/^(assets-library|ipod-library|file|content|ms-appx|ms-appdata|asset):/));
        const selectedDrm = _source.drm || drm;
        const _textTracks = _source.textTracks || textTracks;
        const _drm = !selectedDrm
            ? undefined
            : {
                type: selectedDrm.type,
                licenseServer: selectedDrm.licenseServer,
                headers: (0, utils_1.generateHeaderForNative)(selectedDrm.headers),
                contentId: selectedDrm.contentId,
                certificateUrl: selectedDrm.certificateUrl,
                base64Certificate: selectedDrm.base64Certificate,
                useExternalGetLicense: !!selectedDrm.getLicense,
                multiDrm: selectedDrm.multiDrm,
                localSourceEncryptionKeyScheme: selectedDrm.localSourceEncryptionKeyScheme ||
                    localSourceEncryptionKeyScheme,
            };
        let _cmcd;
        if (react_native_1.Platform.OS === 'android' && source?.cmcd) {
            const cmcd = source.cmcd;
            if (typeof cmcd === 'boolean') {
                _cmcd = cmcd ? { mode: types_1.CmcdMode.MODE_QUERY_PARAMETER } : undefined;
            }
            else if (typeof cmcd === 'object' && !Array.isArray(cmcd)) {
                const createCmcdHeader = (property) => property ? (0, utils_1.generateHeaderForNative)(property) : undefined;
                _cmcd = {
                    mode: cmcd.mode ?? types_1.CmcdMode.MODE_QUERY_PARAMETER,
                    request: createCmcdHeader(cmcd.request),
                    session: createCmcdHeader(cmcd.session),
                    object: createCmcdHeader(cmcd.object),
                    status: createCmcdHeader(cmcd.status),
                };
            }
            else {
                throw new Error('Invalid CMCD configuration: Expected a boolean or an object.');
            }
        }
        const selectedContentStartTime = _source.contentStartTime || contentStartTime;
        const _ad = _source.ad ||
            (adTagUrl || adLanguage
                ? { adTagUrl: adTagUrl, adLanguage: adLanguage }
                : undefined);
        const _minLoadRetryCount = _source.minLoadRetryCount || minLoadRetryCount;
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
            requestHeaders: (0, utils_1.generateHeaderForNative)(resolvedSource.headers),
            startPosition: resolvedSource.startPosition ?? -1,
            cropStart: resolvedSource.cropStart,
            cropEnd: resolvedSource.cropEnd,
            contentStartTime: selectedContentStartTime,
            metadata: resolvedSource.metadata,
            drm: _drm,
            ad: _ad,
            cmcd: _cmcd,
            textTracks: _textTracks,
            textTracksAllowChunklessPreparation: resolvedSource.textTracksAllowChunklessPreparation,
            minLoadRetryCount: _minLoadRetryCount,
            bufferConfig: _bufferConfig,
        };
    }, [
        adLanguage,
        adTagUrl,
        contentStartTime,
        drm,
        localSourceEncryptionKeyScheme,
        minLoadRetryCount,
        source?.cmcd,
        textTracks,
        bufferConfig,
    ]);
    const src = (0, react_1.useMemo)(() => {
        return sourceToUnternalSource(source);
    }, [sourceToUnternalSource, source]);
    const _selectedTextTrack = (0, react_1.useMemo)(() => {
        if (!selectedTextTrack) {
            return;
        }
        const typeOfValueProp = typeof selectedTextTrack.value;
        if (typeOfValueProp !== 'number' &&
            typeOfValueProp !== 'string' &&
            typeOfValueProp !== 'undefined') {
            console.warn('invalid type provided to selectedTextTrack.value: ', typeOfValueProp);
            return;
        }
        return {
            type: selectedTextTrack?.type,
            value: `${selectedTextTrack.value}`,
        };
    }, [selectedTextTrack]);
    const _selectedAudioTrack = (0, react_1.useMemo)(() => {
        if (!selectedAudioTrack) {
            return;
        }
        const typeOfValueProp = typeof selectedAudioTrack.value;
        if (typeOfValueProp !== 'number' &&
            typeOfValueProp !== 'string' &&
            typeOfValueProp !== 'undefined') {
            console.warn('invalid type provided to selectedAudioTrack.value: ', typeOfValueProp);
            return;
        }
        return {
            type: selectedAudioTrack?.type,
            value: `${selectedAudioTrack.value}`,
        };
    }, [selectedAudioTrack]);
    const _selectedVideoTrack = (0, react_1.useMemo)(() => {
        if (!selectedVideoTrack) {
            return;
        }
        const typeOfValueProp = typeof selectedVideoTrack.value;
        if (typeOfValueProp !== 'number' &&
            typeOfValueProp !== 'string' &&
            typeOfValueProp !== 'undefined') {
            console.warn('invalid type provided to selectedVideoTrack.value: ', typeOfValueProp);
            return;
        }
        return {
            type: selectedVideoTrack?.type,
            value: `${selectedVideoTrack.value}`,
        };
    }, [selectedVideoTrack]);
    const seek = (0, react_1.useCallback)(async (time, tolerance) => {
        if (isNaN(time) || time === null) {
            throw new Error("Specified time is not a number: '" + time + "'");
        }
        if (!nativeRef.current) {
            console.warn('Video Component is not mounted');
            return;
        }
        const callSeekFunction = () => {
            NativeVideoManager_1.default.seekCmd((0, utils_1.getReactTag)(nativeRef), time, tolerance || 0);
        };
        react_native_1.Platform.select({
            ios: callSeekFunction,
            android: callSeekFunction,
            default: () => {
                // TODO: Implement VideoManager.seekCmd for windows
                nativeRef.current?.setNativeProps({ seek: time });
            },
        })();
    }, []);
    const pause = (0, react_1.useCallback)(() => {
        return NativeVideoManager_1.default.setPlayerPauseStateCmd((0, utils_1.getReactTag)(nativeRef), true);
    }, []);
    const resume = (0, react_1.useCallback)(() => {
        return NativeVideoManager_1.default.setPlayerPauseStateCmd((0, utils_1.getReactTag)(nativeRef), false);
    }, []);
    const setVolume = (0, react_1.useCallback)((volume) => {
        return NativeVideoManager_1.default.setVolumeCmd((0, utils_1.getReactTag)(nativeRef), volume);
    }, []);
    const setFullScreen = (0, react_1.useCallback)((fullScreen) => {
        return NativeVideoManager_1.default.setFullScreenCmd((0, utils_1.getReactTag)(nativeRef), fullScreen);
    }, []);
    const setSource = (0, react_1.useCallback)((_source) => {
        return NativeVideoManager_1.default.setSourceCmd((0, utils_1.getReactTag)(nativeRef), sourceToUnternalSource(_source));
    }, [sourceToUnternalSource]);
    const presentFullscreenPlayer = (0, react_1.useCallback)(() => setFullScreen(true), [setFullScreen]);
    const dismissFullscreenPlayer = (0, react_1.useCallback)(() => setFullScreen(false), [setFullScreen]);
    const enterPictureInPicture = (0, react_1.useCallback)(async () => {
        if (!nativeRef.current) {
            console.warn('Video Component is not mounted');
            return;
        }
        const _enterPictureInPicture = () => {
            NativeVideoManager_1.default.enterPictureInPictureCmd((0, utils_1.getReactTag)(nativeRef));
        };
        react_native_1.Platform.select({
            ios: _enterPictureInPicture,
            android: _enterPictureInPicture,
            default: () => { },
        })();
    }, []);
    const exitPictureInPicture = (0, react_1.useCallback)(async () => {
        if (!nativeRef.current) {
            console.warn('Video Component is not mounted');
            return;
        }
        const _exitPictureInPicture = () => {
            NativeVideoManager_1.default.exitPictureInPictureCmd((0, utils_1.getReactTag)(nativeRef));
        };
        react_native_1.Platform.select({
            ios: _exitPictureInPicture,
            android: _exitPictureInPicture,
            default: () => { },
        })();
    }, []);
    const save = (0, react_1.useCallback)((options) => {
        // VideoManager.save can be null on android & windows
        if (react_native_1.Platform.OS !== 'ios') {
            return;
        }
        // @todo Must implement it in a different way.
        return NativeVideoManager_1.default.save?.((0, utils_1.getReactTag)(nativeRef), options);
    }, []);
    const getCurrentPosition = (0, react_1.useCallback)(() => {
        // @todo Must implement it in a different way.
        return NativeVideoManager_1.default.getCurrentPosition((0, utils_1.getReactTag)(nativeRef));
    }, []);
    const restoreUserInterfaceForPictureInPictureStopCompleted = (0, react_1.useCallback)((restored) => {
        setRestoreUserInterfaceForPIPStopCompletionHandler(restored);
    }, [setRestoreUserInterfaceForPIPStopCompletionHandler]);
    const onVideoLoadStart = (0, react_1.useCallback)((e) => {
        hasPoster && setShowPoster(true);
        onLoadStart?.(e.nativeEvent);
    }, [hasPoster, onLoadStart]);
    const onVideoLoad = (0, react_1.useCallback)((e) => {
        if (react_native_1.Platform.OS === 'windows') {
            hasPoster && setShowPoster(false);
        }
        onLoad?.(e.nativeEvent);
    }, [onLoad, hasPoster, setShowPoster]);
    const onVideoError = (0, react_1.useCallback)((e) => {
        onError?.(e.nativeEvent);
    }, [onError]);
    const onVideoProgress = (0, react_1.useCallback)((e) => {
        onProgress?.(e.nativeEvent);
    }, [onProgress]);
    const onVideoSeek = (0, react_1.useCallback)((e) => {
        onSeek?.(e.nativeEvent);
    }, [onSeek]);
    const onVideoPlaybackStateChanged = (0, react_1.useCallback)((e) => {
        onPlaybackStateChanged?.(e.nativeEvent);
    }, [onPlaybackStateChanged]);
    const _shutterColor = (0, react_1.useMemo)(() => {
        const color = (0, react_native_1.processColor)(shutterColor);
        return typeof color === 'number' ? color : undefined;
    }, [shutterColor]);
    // android only
    const _onTimedMetadata = (0, react_1.useCallback)((e) => {
        onTimedMetadata?.(e.nativeEvent);
    }, [onTimedMetadata]);
    const _onAudioTracks = (0, react_1.useCallback)((e) => {
        onAudioTracks?.(e.nativeEvent);
    }, [onAudioTracks]);
    const _onTextTracks = (0, react_1.useCallback)((e) => {
        onTextTracks?.(e.nativeEvent);
    }, [onTextTracks]);
    const _onTextTrackDataChanged = (0, react_1.useCallback)((e) => {
        const { ...eventData } = e.nativeEvent;
        delete eventData.target;
        onTextTrackDataChanged?.(eventData);
    }, [onTextTrackDataChanged]);
    const _onVideoTracks = (0, react_1.useCallback)((e) => {
        onVideoTracks?.(e.nativeEvent);
    }, [onVideoTracks]);
    const _onPlaybackRateChange = (0, react_1.useCallback)((e) => {
        onPlaybackRateChange?.(e.nativeEvent);
    }, [onPlaybackRateChange]);
    const _onVolumeChange = (0, react_1.useCallback)((e) => {
        onVolumeChange?.(e.nativeEvent);
    }, [onVolumeChange]);
    const _onReadyForDisplay = (0, react_1.useCallback)(() => {
        hasPoster && setShowPoster(false);
        onReadyForDisplay?.();
    }, [setShowPoster, hasPoster, onReadyForDisplay]);
    const _onPictureInPictureStatusChanged = (0, react_1.useCallback)((e) => {
        onPictureInPictureStatusChanged?.(e.nativeEvent);
    }, [onPictureInPictureStatusChanged]);
    const _onAudioFocusChanged = (0, react_1.useCallback)((e) => {
        onAudioFocusChanged?.(e.nativeEvent);
    }, [onAudioFocusChanged]);
    const onVideoBuffer = (0, react_1.useCallback)((e) => {
        onBuffer?.(e.nativeEvent);
    }, [onBuffer]);
    const onVideoExternalPlaybackChange = (0, react_1.useCallback)((e) => {
        onExternalPlaybackChange?.(e.nativeEvent);
    }, [onExternalPlaybackChange]);
    const _onBandwidthUpdate = (0, react_1.useCallback)((e) => {
        onBandwidthUpdate?.(e.nativeEvent);
    }, [onBandwidthUpdate]);
    const _onReceiveAdEvent = (0, react_1.useCallback)((e) => {
        onReceiveAdEvent?.(e.nativeEvent);
    }, [onReceiveAdEvent]);
    const _onVideoAspectRatio = (0, react_1.useCallback)((e) => {
        onAspectRatio?.(e.nativeEvent);
    }, [onAspectRatio]);
    const _onControlsVisibilityChange = (0, react_1.useCallback)((e) => {
        onControlsVisibilityChange?.(e.nativeEvent);
    }, [onControlsVisibilityChange]);
    const selectedDrm = source?.drm || drm;
    const usingExternalGetLicense = selectedDrm?.getLicense instanceof Function;
    const onGetLicense = (0, react_1.useCallback)(async (event) => {
        if (!usingExternalGetLicense) {
            return;
        }
        const data = event.nativeEvent;
        try {
            if (!data?.spcBase64) {
                throw new Error('No spc received');
            }
            // Handles both scenarios, getLicenseOverride being a promise and not.
            const license = await Promise.resolve(selectedDrm.getLicense(data.spcBase64, data.contentId, data.licenseUrl, data.loadedLicenseUrl)).catch(() => {
                throw new Error('fetch error');
            });
            if (typeof license !== 'string') {
                throw Error('Empty license result');
            }
            if (nativeRef.current) {
                NativeVideoManager_1.default.setLicenseResultCmd((0, utils_1.getReactTag)(nativeRef), license, data.loadedLicenseUrl);
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'fetch error';
            if (nativeRef.current) {
                NativeVideoManager_1.default.setLicenseResultErrorCmd((0, utils_1.getReactTag)(nativeRef), msg, data.loadedLicenseUrl);
            }
        }
    }, [selectedDrm, usingExternalGetLicense]);
    (0, react_1.useImperativeHandle)(ref, () => ({
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
    }), [
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
    ]);
    const _viewType = (0, react_1.useMemo)(() => {
        const hasValidDrmProp = drm !== undefined && Object.keys(drm).length !== 0;
        const shallForceViewType = hasValidDrmProp && (viewType === types_1.ViewType.TEXTURE || useTextureView);
        if (useSecureView && useTextureView) {
            console.warn('cannot use SecureView on texture view. please set useTextureView={false}');
        }
        if (shallForceViewType) {
            console.warn('cannot use DRM on texture view. please set useTextureView={false}');
            return useSecureView ? types_1.ViewType.SURFACE_SECURE : types_1.ViewType.SURFACE;
        }
        if (viewType !== undefined && viewType !== null) {
            return viewType;
        }
        if (useSecureView) {
            return types_1.ViewType.SURFACE_SECURE;
        }
        if (useTextureView) {
            return types_1.ViewType.TEXTURE;
        }
        return types_1.ViewType.SURFACE;
    }, [drm, useSecureView, useTextureView, viewType]);
    const _renderPoster = (0, react_1.useCallback)(() => {
        if (!hasPoster || !showPoster) {
            return null;
        }
        // poster resize mode
        let _posterResizeMode = 'contain';
        if (!isPosterDeprecated && poster?.resizeMode) {
            _posterResizeMode = poster.resizeMode;
        }
        else if (posterResizeMode && posterResizeMode !== 'none') {
            _posterResizeMode = posterResizeMode;
        }
        // poster style
        const baseStyle = {
            ...react_native_1.StyleSheet.absoluteFillObject,
            resizeMode: _posterResizeMode,
        };
        let posterStyle = baseStyle;
        if (!isPosterDeprecated && poster?.style) {
            const styles = Array.isArray(poster.style)
                ? poster.style
                : [poster.style];
            posterStyle = [baseStyle, ...styles];
        }
        // render poster
        if (_renderLoader && (poster || posterResizeMode)) {
            console.warn('You provided both `renderLoader` and `poster` or `posterResizeMode` props. `renderLoader` will be used.');
        }
        // render loader
        if (_renderLoader) {
            return (react_1.default.createElement(react_native_1.View, { style: react_native_1.StyleSheet.absoluteFill }, _renderLoader({
                source: source,
                style: posterStyle,
                resizeMode: resizeMode,
            })));
        }
        return (react_1.default.createElement(react_native_1.Image, { ...(isPosterDeprecated ? {} : poster), source: isPosterDeprecated ? { uri: poster } : poster?.source, style: posterStyle }));
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
    const _style = (0, react_1.useMemo)(() => ({
        ...react_native_1.StyleSheet.absoluteFillObject,
    }), []);
    return (react_1.default.createElement(react_native_1.View, { style: style },
        react_1.default.createElement(VideoNativeComponent_1.default, { ref: nativeRef, ...rest, src: src, style: _style, resizeMode: resizeMode, restoreUserInterfaceForPIPStopCompletionHandler: _restoreUserInterfaceForPIPStopCompletionHandler, selectedTextTrack: _selectedTextTrack, selectedAudioTrack: _selectedAudioTrack, selectedVideoTrack: _selectedVideoTrack, shutterColor: _shutterColor, onGetLicense: usingExternalGetLicense ? onGetLicense : undefined, onVideoLoad: onLoad || hasPoster
                ? onVideoLoad
                : undefined, onVideoLoadStart: onLoadStart || hasPoster ? onVideoLoadStart : undefined, onVideoError: onError ? onVideoError : undefined, onVideoProgress: onProgress ? onVideoProgress : undefined, onVideoSeek: onSeek ? onVideoSeek : undefined, onVideoEnd: onEnd, onVideoBuffer: onBuffer ? onVideoBuffer : undefined, onVideoPlaybackStateChanged: onPlaybackStateChanged ? onVideoPlaybackStateChanged : undefined, onVideoBandwidthUpdate: onBandwidthUpdate ? _onBandwidthUpdate : undefined, onTimedMetadata: onTimedMetadata ? _onTimedMetadata : undefined, onAudioTracks: onAudioTracks ? _onAudioTracks : undefined, onTextTracks: onTextTracks ? _onTextTracks : undefined, onTextTrackDataChanged: onTextTrackDataChanged ? _onTextTrackDataChanged : undefined, onVideoTracks: onVideoTracks ? _onVideoTracks : undefined, onVideoFullscreenPlayerDidDismiss: onFullscreenPlayerDidDismiss, onVideoFullscreenPlayerDidPresent: onFullscreenPlayerDidPresent, onVideoFullscreenPlayerWillDismiss: onFullscreenPlayerWillDismiss, onVideoFullscreenPlayerWillPresent: onFullscreenPlayerWillPresent, onVideoExternalPlaybackChange: onExternalPlaybackChange ? onVideoExternalPlaybackChange : undefined, onVideoIdle: onIdle, onAudioFocusChanged: onAudioFocusChanged ? _onAudioFocusChanged : undefined, onReadyForDisplay: onReadyForDisplay || hasPoster ? _onReadyForDisplay : undefined, onPlaybackRateChange: onPlaybackRateChange ? _onPlaybackRateChange : undefined, onVolumeChange: onVolumeChange ? _onVolumeChange : undefined, onVideoAudioBecomingNoisy: onAudioBecomingNoisy, onPictureInPictureStatusChanged: onPictureInPictureStatusChanged
                ? _onPictureInPictureStatusChanged
                : undefined, onRestoreUserInterfaceForPictureInPictureStop: onRestoreUserInterfaceForPictureInPictureStop, onVideoAspectRatio: onAspectRatio ? _onVideoAspectRatio : undefined, onReceiveAdEvent: onReceiveAdEvent
                ? _onReceiveAdEvent
                : undefined, onControlsVisibilityChange: onControlsVisibilityChange ? _onControlsVisibilityChange : undefined, viewType: _viewType }),
        _renderPoster()));
});
Video.displayName = 'Video';
exports.default = Video;
//# sourceMappingURL=Video.js.map