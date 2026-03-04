import type { UInt64 } from 'react-native-nitro-modules';
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
   * The duration of the video in seconds.
   */
  duration: UInt64;

  /**
   * The file size of the video in bytes.
   */
  fileSize: UInt64;

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
