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
};

// @internal
export interface NativeVideoConfig extends VideoConfig {
  // The uri should be resolved to string before creating the source
  uri: string;
  externalSubtitles?: NativeExternalSubtitle[];
  drm?: NativeDrmParams;
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
