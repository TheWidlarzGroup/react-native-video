import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Double, Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
type Headers = ReadonlyArray<Readonly<{
    key: string;
    value: string;
}>>;
type VideoMetadata = Readonly<{
    title?: string;
    subtitle?: string;
    description?: string;
    imageUri?: string;
}>;
export type AdsConfig = Readonly<{
    adTagUrl?: string;
    adLanguage?: string;
    midRollAdTagUrl?: string;
    postRollAdTagUrl?: string;
    cuePoints?: number[];
}>;
export type VideoSrc = Readonly<{
    uri?: string;
    isLive?: boolean;
    isNetwork?: boolean;
    isAsset?: boolean;
    isLocalAssetFile?: boolean;
    shouldCache?: boolean;
    type?: string;
    mainVer?: Int32;
    patchVer?: Int32;
    requestHeaders?: Headers;
    startPosition?: Float;
    cropStart?: Float;
    cropEnd?: Float;
    contentStartTime?: Int32;
    metadata?: VideoMetadata;
    drm?: Drm;
    cmcd?: NativeCmcdConfiguration;
    textTracksAllowChunklessPreparation?: boolean;
    textTracks?: TextTracks;
    ad?: AdsConfig;
    minLoadRetryCount?: Int32;
    bufferConfig?: BufferConfig;
}>;
type DRMType = WithDefault<string, 'widevine'>;
type DebugConfig = Readonly<{
    enable?: boolean;
    thread?: boolean;
}>;
type Drm = Readonly<{
    type?: DRMType;
    licenseServer?: string;
    headers?: Headers;
    contentId?: string;
    certificateUrl?: string;
    base64Certificate?: boolean;
    useExternalGetLicense?: boolean;
    multiDrm?: WithDefault<boolean, false>;
    localSourceEncryptionKeyScheme?: string;
}>;
type CmcdMode = WithDefault<Int32, 1>;
export type NativeCmcdConfiguration = Readonly<{
    mode?: CmcdMode;
    request?: Headers;
    session?: Headers;
    object?: Headers;
    status?: Headers;
}>;
type TextTracks = ReadonlyArray<Readonly<{
    title: string;
    language: string;
    type: string;
    uri: string;
}>>;
type SelectedTextTrackType = WithDefault<string, 'system'>;
type SelectedAudioTrackType = WithDefault<string, 'system'>;
type SelectedTextTrack = Readonly<{
    type?: SelectedTextTrackType;
    value?: string;
}>;
type SelectedAudioTrack = Readonly<{
    type?: SelectedAudioTrackType;
    value?: string;
}>;
type SelectedVideoTrackType = WithDefault<string, 'auto'>;
type SelectedVideoTrack = Readonly<{
    type?: SelectedVideoTrackType;
    value?: string;
}>;
type BufferConfigLive = Readonly<{
    maxPlaybackSpeed?: Float;
    minPlaybackSpeed?: Float;
    maxOffsetMs?: Int32;
    minOffsetMs?: Int32;
    targetOffsetMs?: Int32;
}>;
type BufferingStrategyType = WithDefault<string, 'Default'>;
type BufferConfig = Readonly<{
    minBufferMs?: Float;
    maxBufferMs?: Float;
    bufferForPlaybackMs?: Float;
    bufferForPlaybackAfterRebufferMs?: Float;
    maxHeapAllocationPercent?: Float;
    backBufferDurationMs?: Float;
    minBackBufferMemoryReservePercent?: Float;
    minBufferMemoryReservePercent?: Float;
    cacheSizeMB?: Float;
    live?: BufferConfigLive;
}>;
type SubtitleStyle = Readonly<{
    fontSize?: Float;
    paddingTop?: WithDefault<Float, 0>;
    paddingBottom?: WithDefault<Float, 0>;
    paddingLeft?: WithDefault<Float, 0>;
    paddingRight?: WithDefault<Float, 0>;
    opacity?: WithDefault<Float, 1>;
    subtitlesFollowVideo?: WithDefault<boolean, true>;
}>;
type OnLoadData = Readonly<{
    currentTime: Float;
    duration: Float;
    naturalSize: Readonly<{
        width: Float;
        height: Float;
        orientation: WithDefault<string, 'landscape'>;
    }>;
    audioTracks: {
        index: Int32;
        title?: string;
        language?: string;
        bitrate?: Float;
        type?: string;
        selected?: boolean;
    }[];
    textTracks: {
        index: Int32;
        title?: string;
        language?: string;
        /**
         * iOS only supports VTT, Android supports all 3
         */
        type?: WithDefault<string, 'srt'>;
        selected?: boolean;
    }[];
}>;
export type OnLoadStartData = Readonly<{
    isNetwork: boolean;
    type: string;
    uri: string;
}>;
export type OnVideoAspectRatioData = Readonly<{
    width: Float;
    height: Float;
}>;
export type OnBufferData = Readonly<{
    isBuffering: boolean;
}>;
export type OnProgressData = Readonly<{
    currentTime: Float;
    playableDuration: Float;
    seekableDuration: Float;
}>;
export type OnBandwidthUpdateData = Readonly<{
    bitrate: Int32;
    width?: Float;
    height?: Float;
    trackId?: Int32;
}>;
export type OnSeekData = Readonly<{
    currentTime: Float;
    seekTime: Float;
}>;
export type OnPlaybackStateChangedData = Readonly<{
    isPlaying: boolean;
    isSeeking: boolean;
}>;
export type OnTimedMetadataData = Readonly<{
    metadata: {
        value?: string;
        identifier: string;
    }[];
}>;
export type OnAudioTracksData = Readonly<{
    audioTracks: {
        index: Int32;
        title?: string;
        language?: string;
        bitrate?: Float;
        type?: string;
        selected?: boolean;
    }[];
}>;
type OnTextTracksData = Readonly<{
    textTracks: {
        index: Int32;
        title?: string;
        language?: string;
        /**
         * iOS only supports VTT, Android supports all 3
         */
        type?: WithDefault<string, 'srt'>;
        selected?: boolean;
    }[];
}>;
export type OnTextTrackDataChangedData = Readonly<{
    subtitleTracks: string;
}>;
export type OnVideoTracksData = Readonly<{
    videoTracks: {
        index: Int32;
        tracksId?: string;
        codecs?: string;
        width?: Float;
        height?: Float;
        bitrate?: Float;
        selected?: boolean;
    }[];
}>;
export type OnPlaybackRateChangeData = Readonly<{
    playbackRate: Float;
}>;
export type OnVolumeChangeData = Readonly<{
    volume: Float;
}>;
export type OnExternalPlaybackChangeData = Readonly<{
    isExternalPlaybackActive: boolean;
}>;
export type OnGetLicenseData = Readonly<{
    licenseUrl: string;
    loadedLicenseUrl: string;
    contentId: string;
    spcBase64: string;
}>;
export type OnPictureInPictureStatusChangedData = Readonly<{
    isActive: boolean;
}>;
type OnReceiveAdEventData = Readonly<{
    data?: {};
    event: WithDefault<string, 'AD_BREAK_ENDED'>;
}>;
export type OnVideoErrorData = Readonly<{
    error: Readonly<{
        errorString?: string;
        errorException?: string;
        errorStackTrace?: string;
        errorCode?: string;
        error?: string;
        code?: Int32;
        localizedDescription?: string;
        localizedFailureReason?: string;
        localizedRecoverySuggestion?: string;
        domain?: string;
    }>;
    target?: Int32;
}>;
export type OnAudioFocusChangedData = Readonly<{
    hasAudioFocus: boolean;
}>;
type ControlsStyles = Readonly<{
    hidePosition?: WithDefault<boolean, false>;
    hidePlayPause?: WithDefault<boolean, false>;
    hideForward?: WithDefault<boolean, false>;
    hideRewind?: WithDefault<boolean, false>;
    hideNext?: WithDefault<boolean, false>;
    hidePrevious?: WithDefault<boolean, false>;
    hideFullscreen?: WithDefault<boolean, false>;
    hideSeekBar?: WithDefault<boolean, false>;
    hideDuration?: WithDefault<boolean, false>;
    hideNavigationBarOnFullScreenMode?: WithDefault<boolean, true>;
    hideNotificationBarOnFullScreenMode?: WithDefault<boolean, true>;
    hideSettingButton?: WithDefault<boolean, true>;
    seekIncrementMS?: Int32;
    liveLabel?: string;
}>;
export type OnControlsVisibilityChange = Readonly<{
    isVisible: boolean;
}>;
export interface VideoNativeProps extends ViewProps {
    src?: VideoSrc;
    allowsExternalPlayback?: boolean;
    disableFocus?: boolean;
    maxBitRate?: Float;
    resizeMode?: WithDefault<string, 'none'>;
    repeat?: boolean;
    automaticallyWaitsToMinimizeStalling?: boolean;
    shutterColor?: Int32;
    audioOutput?: WithDefault<string, 'speaker'>;
    selectedTextTrack?: SelectedTextTrack;
    selectedAudioTrack?: SelectedAudioTrack;
    selectedVideoTrack?: SelectedVideoTrack;
    paused?: boolean;
    muted?: boolean;
    controls?: boolean;
    filter?: WithDefault<string, ''>;
    filterEnabled?: boolean;
    volume?: Float;
    playInBackground?: boolean;
    preventsDisplaySleepDuringVideoPlayback?: boolean;
    preferredForwardBufferDuration?: Float;
    playWhenInactive?: boolean;
    enterPictureInPictureOnLeave?: boolean;
    ignoreSilentSwitch?: WithDefault<string, 'inherit'>;
    mixWithOthers?: WithDefault<string, 'inherit'>;
    rate?: Float;
    fullscreen?: boolean;
    fullscreenAutorotate?: boolean;
    fullscreenOrientation?: WithDefault<string, 'all'>;
    progressUpdateInterval?: Float;
    restoreUserInterfaceForPIPStopCompletionHandler?: boolean;
    debug?: DebugConfig;
    showNotificationControls?: WithDefault<boolean, false>;
    currentPlaybackTime?: Double;
    disableDisconnectError?: boolean;
    focusable?: boolean;
    hideShutterView?: boolean;
    reportBandwidth?: boolean;
    subtitleStyle?: SubtitleStyle;
    viewType?: Int32;
    bufferingStrategy?: BufferingStrategyType;
    controlsStyles?: ControlsStyles;
    disableAudioSessionManagement?: boolean;
    onControlsVisibilityChange?: DirectEventHandler<OnControlsVisibilityChange>;
    onVideoLoad?: DirectEventHandler<OnLoadData>;
    onVideoLoadStart?: DirectEventHandler<OnLoadStartData>;
    onVideoAspectRatio?: DirectEventHandler<OnVideoAspectRatioData>;
    onVideoBuffer?: DirectEventHandler<OnBufferData>;
    onVideoError?: DirectEventHandler<OnVideoErrorData>;
    onVideoProgress?: DirectEventHandler<OnProgressData>;
    onVideoBandwidthUpdate?: DirectEventHandler<OnBandwidthUpdateData>;
    onVideoSeek?: DirectEventHandler<OnSeekData>;
    onVideoEnd?: DirectEventHandler<{}>;
    onVideoAudioBecomingNoisy?: DirectEventHandler<{}>;
    onVideoFullscreenPlayerWillPresent?: DirectEventHandler<{}>;
    onVideoFullscreenPlayerDidPresent?: DirectEventHandler<{}>;
    onVideoFullscreenPlayerWillDismiss?: DirectEventHandler<{}>;
    onVideoFullscreenPlayerDidDismiss?: DirectEventHandler<{}>;
    onReadyForDisplay?: DirectEventHandler<{}>;
    onPlaybackRateChange?: DirectEventHandler<OnPlaybackRateChangeData>;
    onVolumeChange?: DirectEventHandler<OnVolumeChangeData>;
    onVideoExternalPlaybackChange?: DirectEventHandler<OnExternalPlaybackChangeData>;
    onGetLicense?: DirectEventHandler<OnGetLicenseData>;
    onPictureInPictureStatusChanged?: DirectEventHandler<OnPictureInPictureStatusChangedData>;
    onRestoreUserInterfaceForPictureInPictureStop?: DirectEventHandler<{}>;
    onReceiveAdEvent?: DirectEventHandler<OnReceiveAdEventData>;
    onVideoPlaybackStateChanged?: DirectEventHandler<OnPlaybackStateChangedData>;
    onVideoIdle?: DirectEventHandler<{}>;
    onAudioFocusChanged?: DirectEventHandler<OnAudioFocusChangedData>;
    onTimedMetadata?: DirectEventHandler<OnTimedMetadataData>;
    onAudioTracks?: DirectEventHandler<OnAudioTracksData>;
    onTextTracks?: DirectEventHandler<OnTextTracksData>;
    onTextTrackDataChanged?: DirectEventHandler<OnTextTrackDataChangedData>;
    onVideoTracks?: DirectEventHandler<OnVideoTracksData>;
}
type NativeVideoComponentType = HostComponent<VideoNativeProps>;
declare const _default: NativeVideoComponentType;
export default _default;
