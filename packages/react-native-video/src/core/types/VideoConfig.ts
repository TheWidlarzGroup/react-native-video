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
   * The external subtitles to be used.
   * @note on iOS, side loaded subtitles are not supported if source is stream.
   */
  externalSubtitles?: ExternalSubtitle[];
};

// @internal
export interface NativeVideoConfig extends VideoConfig {
  // The uri should be resolved to string before creating the source
  uri: string;
  externalSubtitles?: NativeExternalSubtitle[];
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
}

export type ExternalSubtitle =
  | ExternalSubtitleWithInferredType
  | ExternalSubtitleWithCustomType;

interface NativeExternalSubtitle {
  uri: string;
  label: string;
  type: SubtitleType;
}
