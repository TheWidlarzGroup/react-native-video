export interface VideoTrack {
  /**
   * Unique identifier for the video track
   */
  id: string;

  /**
   * Display label for the video track
   */
  label: string;

  /**
   * Language code (ISO 639-1 or ISO 639-2)
   * @example "en", "es", "fr"
   */
  language?: string;

  /**
   * Whether this track is currently selected
   */
  selected: boolean;
}
