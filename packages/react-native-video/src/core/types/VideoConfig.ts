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
}

export interface ExternalSubtitle {
  /**
   * The uri of the subtitle.
   */
  uri: string;
  /**
   * Text that will be displayed for the subtitle.
   */
  label: string;
}
