export interface AudioTrack {
  /**
   * Opaque identifier for this audio track. Stable for the lifetime of the
   * current source, but has no meaning across sources/episodes.
   */
  id: string;
  label: string;
  language?: string;
  selected: boolean;
  /** Channel count, e.g. 2 for stereo, 6 for 5.1 surround, when known. */
  channels?: number;
}
