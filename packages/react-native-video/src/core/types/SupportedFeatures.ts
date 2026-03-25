/**
 * Describes which optional features are supported by the current player platform.
 * Use this to check feature availability before calling platform-specific methods.
 *
 * @example
 * ```ts
 * if (player.supportedFeatures.audioTrackSelection) {
 *   const tracks = player.getAvailableAudioTracks();
 * }
 * ```
 */
export interface SupportedFeatures {
  /** Whether audio track listing and selection is supported. @platform web */
  audioTrackSelection: boolean;
  /** Whether video track listing and selection is supported. @platform web */
  videoTrackSelection: boolean;
  /** Whether quality level listing and selection is supported. @platform web */
  qualitySelection: boolean;
}
