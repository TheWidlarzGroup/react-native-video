import type { BufferConfig } from './BufferConfig';
import type { DrmParams } from './DrmParams';

export type VideoSource = number | string;

export type VideoConfig = {
  /**
   * The uri of the video.
   * @example
   * ```ts
   * uri: 'https://example.com/video.mp4'
   * // or
   * uri: require('./assets/video.mp4')
   * ```
   */
  uri: VideoSource;
  /**
   * The headers to be sent with the request.
   */
  headers?: Record<string, string>;
  /**
   * The DRM parameters to be used.
   */
  drm?: DrmParams;
  /**
   * The player buffer configuration.
   */
  bufferConfig?: BufferConfig;
  /**
   * The custom metadata to be associated with the video.
   * This metadata can be used by the native player to show information about the video.
   */
  metadata?: CustomVideoMetadata;
  /**
   * The external subtitles to be used.
   * @note on iOS, only WebVTT (.vtt) subtitles are supported (for HLS streams and MP4 files).
   * @note on iOS, `label` can be overridden by player and there is no way to get around it.
   * @example
   * ```ts
   * externalSubtitles: [
   *   {
   *     uri: 'https://example.com/subtitles_en.vtt',
   *     label: 'English',
   *     type: 'vtt',
   *     language: 'en'
   *   },
   *   {
   *     uri: 'https://example.com/subtitles_es.vtt',
   *     label: 'Español',
   *     type: 'vtt',
   *     language: 'es'
   *   }
   * ]
   * ```
   */
  externalSubtitles?: ExternalSubtitle[];
  /**
   * when the player is created, this flag will determine if native player should be initialized immediately.
   * If set to true, the player will be initialized as soon as player is created
   * If set to false, the player will need be initialized manually later
   * @default true
   */
  initializeOnCreation?: boolean;
  /**
   * How many times a failed load (manifest, segment, media file) is retried before the
   * player reports an error.
   * @default 3
   * @platform android
   */
  minLoadRetryCount?: number;
  /**
   * Keep retrying once a second while the device has no connection, instead of reporting
   * an error after `minLoadRetryCount` attempts. Playback continues when the connection
   * is back.
   * @default false
   * @platform android
   */
  disableDisconnectError?: boolean;
  /**
   * The stream type, as a file extension, for a uri that does not show it: `'m3u8'` (HLS),
   * `'mpd'` (DASH) or `'ism'` (SmoothStreaming). Any other value means a single media file.
   * Without it the type is read from the uri.
   * @example
   * ```ts
   * { uri: 'https://example.com/live/stream?id=42', type: 'm3u8' }
   * ```
   * @platform android
   */
  type?: string;
  /**
   * Whether an HLS stream may be prepared from its playlists alone, without downloading
   * media chunks first. Set it to `false` when a stream lists subtitle or audio renditions
   * without a `CODECS` attribute and those tracks do not show up.
   * @default true
   * @platform android
   */
  textTracksAllowChunklessPreparation?: boolean;
  /**
   * Send Common Media Client Data (CMCD, CTA-5004) with the requests of an HLS, DASH or
   * SmoothStreaming stream, so the CDN can see buffer length, bitrate, session id and so on.
   * `true` sends the standard keys as a query parameter. Pass an object to choose the mode
   * or to add your own keys.
   * @example
   * ```ts
   * cmcd: { mode: 'header', session: { 'com.example-tenant': 'acme' } }
   * ```
   * @platform android
   */
  cmcd?: boolean | CmcdConfiguration;
};

/**
 * How CMCD data is sent: in the `CMCD` query parameter or in the `CMCD-*` request headers.
 */
export type CmcdMode = 'query' | 'header';

/**
 * Custom CMCD keys. A key must carry a hyphenated prefix, for example `com.example-tenant`
 * (CTA-5004, section 3.1). Strings are sent quoted, numbers as they are.
 */
export type CmcdData = Record<`${string}-${string}`, string | number>;

export interface CmcdConfiguration {
  /**
   * @default 'query'
   */
  mode?: CmcdMode;
  /** Custom keys for the `CMCD-Request` group. */
  request?: CmcdData;
  /** Custom keys for the `CMCD-Session` group. */
  session?: CmcdData;
  /** Custom keys for the `CMCD-Object` group. */
  object?: CmcdData;
  /** Custom keys for the `CMCD-Status` group. */
  status?: CmcdData;
}

// @internal
export interface NativeVideoConfig extends Omit<VideoConfig, 'cmcd'> {
  // The uri should be resolved to string before creating the source
  uri: string;
  externalSubtitles?: NativeExternalSubtitle[];
  drm?: NativeDrmParams;
  cmcd?: NativeCmcdConfiguration;
}

// @internal Custom keys arrive already formatted as CMCD pairs (`key="text"`, `key=1`).
export interface NativeCmcdConfiguration {
  mode: CmcdMode;
  requestData?: string[];
  sessionData?: string[];
  objectData?: string[];
  statusData?: string[];
}

/**
 * The type of the subtitle.
 * - `vtt` - WebVTT
 * - `srt` - SubRip
 * - `ssa` - SubStation Alpha
 * - `ass` - Advanced SubStation Alpha
 * - `auto` - Auto detect the subtitle type from the file extension
 *
 * @note `auto` is not available when uri have no extension.
 */
export type SubtitleType = 'vtt' | 'srt' | 'ssa' | 'ass' | 'auto';

interface ExternalSubtitleWithInferredType {
  /**
   * The uri of the subtitle.
   * @note the uri must end with the subtitle type.
   */
  uri: `${string}.${SubtitleType}`;
  /**
   * The label for the subtitle.
   */
  label: string;
  /**
   * The type of the subtitle.
   */
  type?: SubtitleType;
  /**
   * The language code for the subtitle (ISO 639-1 or ISO 639-2).
   * @example 'en', 'es', 'fr', 'de', 'zh-CN'
   * @default 'und' (undefined)
   */
  language?: string;
}

interface ExternalSubtitleWithCustomType {
  /**
   * The uri of the subtitle.
   */
  uri: string;
  /**
   * The label for the subtitle.
   */
  label: string;
  /**
   * The type of the subtitle.
   */
  type: Omit<SubtitleType, 'auto'>;
  /**
   * The language code for the subtitle (ISO 639-1 or ISO 639-2).
   * @example 'en', 'es', 'fr', 'de', 'zh-CN'
   * @default 'und' (undefined)
   */
  language?: string;
}

export type ExternalSubtitle =
  | ExternalSubtitleWithInferredType
  | ExternalSubtitleWithCustomType;

interface NativeExternalSubtitle {
  uri: string;
  label: string;
  type: SubtitleType;
  language: string;
}

interface NativeDrmParams extends DrmParams {
  type?: string;
}

export interface CustomVideoMetadata {
  title?: string;
  subtitle?: string;
  description?: string;
  artist?: string;
  imageUri?: string;
}
