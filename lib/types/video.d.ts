import type { ISO639_1 } from './language';
import type { ReactVideoEvents } from './events';
import type { ImageProps, StyleProp, ViewProps, ViewStyle, ImageRequireSource, ImageURISource, ImageStyle } from 'react-native';
import type { ReactNode } from 'react';
import type VideoResizeMode from './ResizeMode';
import type FilterType from './FilterType';
import type ViewType from './ViewType';
export type Headers = Record<string, string>;
export type EnumValues<T extends string | number> = T extends string ? `${T}` | T : T;
export type ReactVideoSourceProperties = {
    uri?: string;
    isLive?: boolean;
    isNetwork?: boolean;
    isAsset?: boolean;
    isLocalAssetFile?: boolean;
    shouldCache?: boolean;
    type?: string;
    mainVer?: number;
    patchVer?: number;
    headers?: Headers;
    startPosition?: number;
    cropStart?: number;
    cropEnd?: number;
    contentStartTime?: number;
    metadata?: VideoMetadata;
    drm?: Drm;
    cmcd?: Cmcd;
    textTracksAllowChunklessPreparation?: boolean;
    textTracks?: TextTracks;
    ad?: AdConfig;
    minLoadRetryCount?: number;
    bufferConfig?: BufferConfig;
};
export type ReactVideoSource = Readonly<Omit<ReactVideoSourceProperties, 'uri'> & {
    uri?: string | NodeRequire;
}>;
export type ReactVideoPosterSource = ImageURISource | ImageRequireSource;
export type ReactVideoPoster = Omit<ImageProps, 'source'> & {
    source?: ReactVideoPosterSource;
};
export type VideoMetadata = Readonly<{
    title?: string;
    subtitle?: string;
    description?: string;
    artist?: string;
    imageUri?: string;
}>;
export type DebugConfig = Readonly<{
    enable?: boolean;
    thread?: boolean;
}>;
export declare enum DRMType {
    WIDEVINE = "widevine",
    PLAYREADY = "playready",
    CLEARKEY = "clearkey",
    FAIRPLAY = "fairplay"
}
export type AdConfig = Readonly<{
    adTagUrl?: string;
    adLanguage?: ISO639_1;
    midRollAdTagUrl?: string;
    postRollAdTagUrl?: string;
    cuePoints?: number[];
}>;
export type Drm = Readonly<{
    type?: DRMType;
    licenseServer?: string;
    headers?: Headers;
    contentId?: string;
    certificateUrl?: string;
    base64Certificate?: boolean;
    multiDrm?: boolean;
    localSourceEncryptionKeyScheme?: string;
    getLicense?: (spcBase64: string, contentId: string, licenseUrl: string, loadedLicenseUrl: string) => string | Promise<string>;
}>;
export declare enum CmcdMode {
    MODE_REQUEST_HEADER = 0,
    MODE_QUERY_PARAMETER = 1
}
/**
 * Custom key names MUST carry a hyphenated prefix to ensure that there will not be a
 * namespace collision with future revisions to this specification. Clients SHOULD
 * use a reverse-DNS syntax when defining their own prefix.
 *
 * @see https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf CTA-5004 Specification (Page 6, Section 3.1)
 */
export type CmcdData = Record<`${string}-${string}`, string | number>;
export type CmcdConfiguration = Readonly<{
    mode?: CmcdMode;
    request?: CmcdData;
    session?: CmcdData;
    object?: CmcdData;
    status?: CmcdData;
}>;
export type Cmcd = boolean | CmcdConfiguration;
export declare enum BufferingStrategyType {
    DEFAULT = "Default",
    DISABLE_BUFFERING = "DisableBuffering",
    DEPENDING_ON_MEMORY = "DependingOnMemory"
}
export type BufferConfigLive = {
    maxPlaybackSpeed?: number;
    minPlaybackSpeed?: number;
    maxOffsetMs?: number;
    minOffsetMs?: number;
    targetOffsetMs?: number;
};
export type BufferConfig = {
    minBufferMs?: number;
    maxBufferMs?: number;
    bufferForPlaybackMs?: number;
    bufferForPlaybackAfterRebufferMs?: number;
    backBufferDurationMs?: number;
    maxHeapAllocationPercent?: number;
    minBackBufferMemoryReservePercent?: number;
    minBufferMemoryReservePercent?: number;
    initialBitrate?: number;
    cacheSizeMB?: number;
    live?: BufferConfigLive;
};
export declare enum SelectedTrackType {
    SYSTEM = "system",
    DISABLED = "disabled",
    TITLE = "title",
    LANGUAGE = "language",
    INDEX = "index"
}
export type SelectedTrack = {
    type: SelectedTrackType;
    value?: string | number;
};
export declare enum SelectedVideoTrackType {
    AUTO = "auto",
    DISABLED = "disabled",
    RESOLUTION = "resolution",
    INDEX = "index"
}
export type SelectedVideoTrack = {
    type: SelectedVideoTrackType;
    value?: string | number;
};
export type SubtitleStyle = {
    fontSize?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    opacity?: number;
    subtitlesFollowVideo?: boolean;
};
export declare enum TextTrackType {
    SUBRIP = "application/x-subrip",
    TTML = "application/ttml+xml",
    VTT = "text/vtt"
}
export type TextTracks = {
    title: string;
    language: ISO639_1;
    type: TextTrackType;
    uri: string;
}[];
export type TextTrackSelectionType = 'system' | 'disabled' | 'title' | 'language' | 'index';
export type SelectedTextTrack = Readonly<{
    type: TextTrackSelectionType;
    value?: string | number;
}>;
export type AudioTrackSelectionType = 'system' | 'disabled' | 'title' | 'language' | 'index';
export type SelectedAudioTrack = Readonly<{
    type: AudioTrackSelectionType;
    value?: string | number;
}>;
export type Chapters = {
    title: string;
    startTime: number;
    endTime: number;
    uri?: string;
};
export declare enum FullscreenOrientationType {
    ALL = "all",
    LANDSCAPE = "landscape",
    PORTRAIT = "portrait"
}
export declare enum IgnoreSilentSwitchType {
    INHERIT = "inherit",
    IGNORE = "ignore",
    OBEY = "obey"
}
export declare enum MixWithOthersType {
    INHERIT = "inherit",
    MIX = "mix",
    DUCK = "duck"
}
export declare enum PosterResizeModeType {
    CONTAIN = "contain",
    CENTER = "center",
    COVER = "cover",
    NONE = "none",
    REPEAT = "repeat",
    STRETCH = "stretch"
}
export type AudioOutput = 'speaker' | 'earpiece';
export type ControlsStyles = {
    hideSeekBar?: boolean;
    hideDuration?: boolean;
    hidePosition?: boolean;
    hidePlayPause?: boolean;
    hideForward?: boolean;
    hideRewind?: boolean;
    hideNext?: boolean;
    hidePrevious?: boolean;
    hideFullscreen?: boolean;
    hideNavigationBarOnFullScreenMode?: boolean;
    hideNotificationBarOnFullScreenMode?: boolean;
    hideSettingButton?: boolean;
    seekIncrementMS?: number;
    liveLabel?: string;
};
export interface ReactVideoRenderLoaderProps {
    source?: ReactVideoSource;
    style?: StyleProp<ImageStyle>;
    resizeMode?: EnumValues<VideoResizeMode>;
}
export interface ReactVideoProps extends ReactVideoEvents, ViewProps {
    source?: ReactVideoSource;
    /** @deprecated Use source.drm */
    drm?: Drm;
    style?: StyleProp<ViewStyle>;
    /** @deprecated Use source.ad.adTagUrl */
    adTagUrl?: string;
    /** @deprecated Use source.ad.adLanguage */
    adLanguage?: ISO639_1;
    audioOutput?: AudioOutput;
    automaticallyWaitsToMinimizeStalling?: boolean;
    /** @deprecated Use source.bufferConfig */
    bufferConfig?: BufferConfig;
    bufferingStrategy?: BufferingStrategyType;
    chapters?: Chapters[];
    /** @deprecated Use source.contentStartTime */
    contentStartTime?: number;
    controls?: boolean;
    currentPlaybackTime?: number;
    disableFocus?: boolean;
    disableDisconnectError?: boolean;
    filter?: EnumValues<FilterType>;
    filterEnabled?: boolean;
    focusable?: boolean;
    fullscreen?: boolean;
    fullscreenAutorotate?: boolean;
    fullscreenOrientation?: EnumValues<FullscreenOrientationType>;
    hideShutterView?: boolean;
    ignoreSilentSwitch?: EnumValues<IgnoreSilentSwitchType>;
    /** @deprecated Use source.minLoadRetryCount */
    minLoadRetryCount?: number;
    maxBitRate?: number;
    mixWithOthers?: EnumValues<MixWithOthersType>;
    muted?: boolean;
    paused?: boolean;
    enterPictureInPictureOnLeave?: boolean;
    playInBackground?: boolean;
    playWhenInactive?: boolean;
    poster?: string | ReactVideoPoster;
    /** @deprecated use **resizeMode** key in **poster** props instead */
    posterResizeMode?: EnumValues<PosterResizeModeType>;
    preferredForwardBufferDuration?: number;
    preventsDisplaySleepDuringVideoPlayback?: boolean;
    progressUpdateInterval?: number;
    rate?: number;
    renderLoader?: ReactNode | ((arg0: ReactVideoRenderLoaderProps) => ReactNode);
    repeat?: boolean;
    reportBandwidth?: boolean;
    resizeMode?: EnumValues<VideoResizeMode>;
    showNotificationControls?: boolean;
    selectedAudioTrack?: SelectedTrack;
    selectedTextTrack?: SelectedTrack;
    selectedVideoTrack?: SelectedVideoTrack;
    subtitleStyle?: SubtitleStyle;
    shutterColor?: string;
    /** @deprecated Use source.textTracks */
    textTracks?: TextTracks;
    testID?: string;
    viewType?: ViewType;
    /** @deprecated Use viewType */
    useTextureView?: boolean;
    /** @deprecated Use viewType*/
    useSecureView?: boolean;
    volume?: number;
    /** @deprecated use **localSourceEncryptionKeyScheme** key in **drm** props instead */
    localSourceEncryptionKeyScheme?: string;
    debug?: DebugConfig;
    allowsExternalPlayback?: boolean;
    controlsStyles?: ControlsStyles;
    disableAudioSessionManagement?: boolean;
}
