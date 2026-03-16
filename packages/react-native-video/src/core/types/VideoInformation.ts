import type { Int64 } from 'react-native-nitro-modules';
import type { VideoOrientation } from './VideoOrientation';

export interface VideoInformation {
  /**
   * The bitrate of the video in kbps.
   */
  bitrate: number;

  /**
   * The width of the video in pixels.
   */
  width: number;

  /**
   * The height of the video in pixels.
   */
  height: number;

  /**
   * The duration of the video in seconds, or `-1` if not available.
   */
  duration: number;

  /**
   * The file size of the video in bytes, or `-1` if not available.
   */
  fileSize: Int64;

  /**
   * Whether the video is HDR.
   */
  isHDR: boolean;

  /**
   * Whether the video is live
   */
  isLive: boolean;

  /**
   * The orientation of the video.
   * see {@link VideoOrientation}
   */
  orientation: VideoOrientation;
}
