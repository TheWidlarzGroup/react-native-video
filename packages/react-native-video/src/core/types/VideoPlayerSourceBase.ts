import type { VideoInformation } from './VideoInformation';

export interface VideoPlayerSourceBase {
  /**
   * The URI of the asset.
   */
  readonly uri: string;

  /**
   * Get the information about the asset.
   */
  getAssetInformationAsync(): Promise<VideoInformation>;
}
