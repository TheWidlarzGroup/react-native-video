export interface TextTrack {
  /**
   * Unique identifier for the text track
   */
  id: string;

  /**
   * Display label for the text track
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
