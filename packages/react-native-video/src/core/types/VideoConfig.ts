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
   * The position, in milliseconds, at which playback of this source starts.
   * It is applied when the source is loaded (on creation, `initialize()`, `preload()` or `replaceSourceAsync()`).
   * A value that is not greater than 0 is ignored.
   * @example
   * ```ts
   * startPosition: 30_000 // start 30 seconds in
   * ```
   */
  startPosition?: number;
  /**
   * Plays only the part of the source that starts at this position, in milliseconds.
   * The player treats that part as the whole video: `currentTime` is 0 at `cropStart`
   * and `duration` is the length of the part. `startPosition` counts from `cropStart`.
   * A value that is not greater than 0 is ignored.
   * @platform android, ios
   * @example
   * ```ts
   * cropStart: 36_000, cropEnd: 48_500 // play 12.5 seconds of the video
   * ```
   */
  cropStart?: number;
  /**
   * Plays only the part of the source that ends at this position, in milliseconds
   * from the beginning of the source. Playback ends there and `onEnd` is emitted.
   * A value that is not greater than `cropStart` (or 0) is ignored.
   * @platform android, ios
   */
  cropEnd?: number;
  /**
   * when the player is created, this flag will determine if native player should be initialized immediately.
   * If set to true, the player will be initialized as soon as player is created
   * If set to false, the player will need be initialized manually later
   * @default true
   */
  initializeOnCreation?: boolean;
  /**
   * Keep the downloaded file on disk and play it from there next time.
   *
   * Only progressive files loaded over the network (for example `.mp4`) are cached. HLS and
   * DASH streams, DRM content and sources with `externalSubtitles` are played without the cache.
   * The cache is shared by all players, lives in the app's cache directory and evicts the least
   * recently used files above 100 MB. A file larger than 100 MB is never kept, it is downloaded
   * again on every play.
   *
   * A cached file is identified by the `uri` and the `headers` of the source, so changing a
   * header (for example a refreshed `Authorization` token) starts a new file.
   *
   * @platform android, ios
   * @default false
   */
  shouldCache?: boolean;
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
