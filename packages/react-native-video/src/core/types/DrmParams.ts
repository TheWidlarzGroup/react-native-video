/**
 * Headers type specifically for DRM license requests
 */

export interface DrmParams {
  /**
   * The license URL for the DRM license request.
   * @platform iOS, visionOS
   */
  licenseUrl?: string;
  /**
   * The certificate URL for the DRM license request.
   * @platform iOS, visionOS
   */
  certificateUrl?: string;
  /**
   * The content ID for the DRM license request.
   * @platform iOS, visionOS
   */
  contentId?: string;
  /**
   * The type of DRM to use.
   * @platform Android, iOS, visionOS
   */
  type?: DRMType;
  /**
   * The headers to send with the DRM license request.
   * @platform Android, iOS, visionOS
   */
  licenseHeaders?: Record<string, string>;
  /**
   * Whether to allow multiple sessions for the DRM license request.
   * @platform Android
   */
  multiSession?: boolean;
  /**
   * A function to get the license for the DRM license request.
   * @platform iOS
   */
  getLicense?: (payload: OnGetLicensePayload) => Promise<string>;
}

interface OnGetLicensePayload {
  /**
   * The content ID for the DRM license request.
   * This is typically a unique identifier for the content being played.
   */
  contentId: string;
  /**
   * The license URL for the DRM license request.
   */
  licenseUrl: string;
  /**
   * The key URL for the DRM license request.
   * Typically starts with starting with skd:// or clearkey://
   */
  keyUrl: string;
  /**
   * The secure playback context (SPC) for the DRM license request.
   * This is typically a base64-encoded string that contains information about the playback environment.
   */
  spc: string;
}

type DRMType = 'widevine' | 'fairplay' | (string & {});
