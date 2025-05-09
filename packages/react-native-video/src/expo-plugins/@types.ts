export type ConfigProps = {
  /**
   * Whether to use react-native-test-app compatible mode.
   * @default false
   */
  reactNativeTestApp?: boolean;

  /**
   * Apply configs to be able to use Picture-in-picture on Android.
   * @default false
   */
  enableAndroidPictureInPicture?: boolean;

  /**
   * Whether to enable background audio feature.
   * @default false
   */
  enableBackgroundAudio?: boolean;

  /**
   * Android extensions for ExoPlayer - you can choose which extensions to include in order to reduce the size of the app.
   * @default { useExoplayerDash: true, useExoplayerHls: true }
   */
  androidExtensions?: {
    /**
     * Whether to use ExoPlayer's Dash extension.
     * @default true
     */
    useExoplayerDash?: boolean;

    /**
     * Whether to use ExoPlayer's HLS extension.
     * @default true
     */
    useExoplayerHls?: boolean;
  };
};
