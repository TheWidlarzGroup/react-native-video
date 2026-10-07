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
   * Whether to register the Android playback service (`VideoPlaybackService`) and the
   * `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions it needs.
   * The player starts this service when `playInBackground` or `showNotificationControls`
   * is enabled at runtime. Set to `false` only if your app uses neither, e.g. to avoid the
   * foreground service declaration in the Play Console.
   * @default true
   */
  enableAndroidPlaybackService?: boolean;

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
