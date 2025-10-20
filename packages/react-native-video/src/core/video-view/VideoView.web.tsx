import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import { View, type ViewStyle } from "react-native";
import type { VideoPlayer } from "../VideoPlayer.web";
import type { VideoViewProps, VideoViewRef } from "./ViewViewProps";

/**
 * VideoView is a component that allows you to display a video from a {@link VideoPlayer}.
 *
 * @param player - The player to play the video - {@link VideoPlayer}
 * @param controls - Whether to show the controls. Defaults to false.
 * @param style - The style of the video view - {@link ViewStyle}
 * @param pictureInPicture - Whether to show the picture in picture button. Defaults to false.
 * @param autoEnterPictureInPicture - Whether to automatically enter picture in picture mode
 * when the video is playing. Defaults to false.
 * @param resizeMode - How the video should be resized to fit the view. Defaults to 'none'.
 */
const VideoView = forwardRef<VideoViewRef, VideoViewProps>(
  (
    {
      player: nPlayer,
      controls = false,
      resizeMode = "none",
      // auto pip is unsupported
      pictureInPicture = false,
      autoEnterPictureInPicture = false,
      keepScreenAwake = true,
      ...props
    },
    ref,
  ) => {
    const player = nPlayer as unknown as VideoPlayer;
    const vRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const videoElement = player.__getNativeRef();
      vRef.current?.appendChild(videoElement);
      return () => vRef.current?.replaceChildren();
    }, [player]);

    useImperativeHandle(
      ref,
      () => ({
        enterFullscreen: () => {
          player.player.requestFullscreen({ navigationUI: "hide" });
        },
        exitFullscreen: () => {
          document.exitFullscreen();
        },
        enterPictureInPicture: () => {
          player.player.requestPictureInPicture();
        },
        exitPictureInPicture: () => {
          document.exitPictureInPicture();
        },
        canEnterPictureInPicture: () => document.pictureInPictureEnabled,
      }),
      [player],
    );

    useEffect(() => {
      player.player.controls(controls);
    }, [player, controls]);

    useEffect(() => {
      const vid = player.__getNativeRef();
      const objectFit: CSSProperties["objectFit"] =
        resizeMode === "stretch" ? "fill" : resizeMode;
      vid.style = `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: ${objectFit}`;
    }, [player, resizeMode]);

    return (
      <View {...props}>
        <div
          ref={vRef}
          style={{
            position: "absolute",
            inset: 0,
          }}
        />
      </View>
    );
  },
);

VideoView.displayName = "VideoView";

export default memo(VideoView);
