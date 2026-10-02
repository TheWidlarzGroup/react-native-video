export interface VideoTrack {
  /**
   * Opaque identifier for this rendition. Stable for the lifetime of the
   * current source, but has no meaning across sources/episodes - do not
   * persist it as a user preference, resolve a preference against
   * {@link width}/{@link height} instead.
   */
  id: string;
  /**
   * Human-readable label, e.g. "1080p" or "640p - 1.2 Mbps" when another
   * rendition shares the same resolution (see {@link width}/{@link height}).
   */
  label: string;
  language?: string;
  selected: boolean;
  /** Frame width in pixels, as declared by the manifest/container. */
  width?: number;
  /** Frame height in pixels, as declared by the manifest/container. */
  height?: number;
  /** Peak bitrate in bits per second (HLS `BANDWIDTH`, Media3 `Format.bitrate`). */
  bitrate?: number;
}
