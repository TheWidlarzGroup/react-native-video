export interface QualityLevel {
  /**
   * Unique identifier for the quality
   */
  id: string;

  /**
   * Width of the quality
   */
  width: number;

  /**
   * Height of the quality
   */
  height: number;

  /**
   * Bitrate of the quality
   */
  bitrate: number;

  /**
   * Whether this quality is currently selected
   */
  selected: boolean;
}
