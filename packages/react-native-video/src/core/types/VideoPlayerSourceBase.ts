import type { NativeVideoConfig } from './VideoConfig';
import type { VideoInformation } from './VideoInformation';

export interface VideoPlayerSourceBase {
  /**
   * The URI of the asset.
   */
  readonly uri: string;

  /**
   * The config of the asset.
   */
  readonly config: NativeVideoConfig;

  /**
   * Get the information about the asset.
   */
  getAssetInformationAsync(): Promise<VideoInformation>;
}
