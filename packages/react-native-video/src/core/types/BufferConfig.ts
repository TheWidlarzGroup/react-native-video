export interface LivePlaybackParams {
  /**
   * Minimum playback speed for catching up to target live offset.
   * @platform android
   */
  minPlaybackSpeed?: number;
  /**
   * Maximum playback speed for catching up to target live offset.
   * @platform android
   */
  maxPlaybackSpeed?: number;
  /**
   * Maximum allowed live offset. The player won’t exceed this limit.
   * @platform android
   */
  maxOffsetMs?: number;
  /**
   * Minimum allowed live offset. The player won’t go below this limit.
   * @platform android
   */
  minOffsetMs?: number;
  /**
   * Target live offset. The player will try to maintain this offset.
   * @platform android, ios, visionOS, tvOS
   */
  targetOffsetMs?: number;
}

interface Resolution {
  width: number;
  height: number;
}

export interface BufferConfig {
  /**
   * Configuration for live playback.
   */
  livePlayback?: LivePlaybackParams;

  // -------- Android specific options --------

  /**
   * Minimum duration (ms) the player will attempt to keep buffered.
   * @default 5000
   * @platform android
   */
  minBufferMs?: number;
  /**
   * Maximum duration (ms) the player will attempt to keep buffered.
   * @default 10000
   * @platform android
   */
  maxBufferMs?: number;
  /**
   * Duration (ms) of media that must be buffered for playback to start or resume following a user action such as a seek.
   * @default 1000
   * @platform android
   */
  bufferForPlaybackMs?: number;
  /**
   * Duration (ms) of media that must be buffered for playback to resume after a rebuffer.
   * @default 2000
   * @platform android
   */
  bufferForPlaybackAfterRebufferMs?: number;
  /**
   * Duration (ms) of media that must be buffered before it can be played from the back buffer.
   * @platform android
   */
  backBufferDurationMs?: number;

  // -------- iOS specific options --------

  /**
   * The preferred duration (ms) of media that the player will attempt to retain in the buffer.
   * @platform ios, visionOS, tvOS
   */
  preferredForwardBufferDurationMs?: number;
  /**
   * The desired limit, in bits per second, of network bandwidth used for loading the current item.
   *
   * You can use {@linkcode preferredPeakBitRateForExpensiveNetworks} to set a different bit rate when on an expensive network (e.g. cellular).
   * @platform ios, visionOS, tvOS
   */
  preferredPeakBitRate?: number;
  /**
   * The preferred maximum resolution of the video.
   *
   * You can use {@linkcode preferredMaximumResolutionForExpensiveNetworks} to set a different resolution when on an expensive network (e.g. cellular).
   * @platform ios, visionOS, tvOS
   */
  preferredMaximumResolution?: Resolution;
  /**
   * The desired limit, in bits per second, of network bandwidth used for loading the current item when on an expensive network (e.g. cellular).
   * @platform ios, visionOS, tvOS
   */
  preferredPeakBitRateForExpensiveNetworks?: number;
  /**
   * The preferred maximum resolution of the video when on an expensive network (e.g. cellular).
   * @platform ios, visionOS, tvOS
   */
  preferredMaximumResolutionForExpensiveNetworks?: Resolution;
}
