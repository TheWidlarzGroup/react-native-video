import {
	forwardRef,
	type HTMLProps,
	memo,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import type { ViewProps, ViewStyle } from "react-native";
import { unstable_createElement } from "react-native-web";
import { VideoError } from "../types/VideoError";
import type { VideoPlayer } from "../VideoPlayer.web";
import type { VideoViewProps, VideoViewRef } from "./ViewViewProps";

const Video = (
	props: Omit<HTMLProps<HTMLVideoElement>, keyof ViewProps> & ViewProps,
) => unstable_createElement("video", props);

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
			player,
			controls = false,
			resizeMode = "none",
			style,
			// auto pip is unsupported
			pictureInPicture = false,
			autoEnterPictureInPicture = false,
			keepScreenAwake = true,
			...props
		},
		ref,
	) => {
		const vRef = useRef<HTMLVideoElement>(null);
		useEffect(() => {
			const webPlayer = player as unknown as VideoPlayer;
			if (vRef.current) webPlayer.__getNativePlayer().attach(vRef.current);
		}, [player]);

		useImperativeHandle(
			ref,
			() => ({
				enterFullscreen: () => {
					vRef.current?.requestFullscreen({ navigationUI: "hide" });
				},
				exitFullscreen: () => {
					document.exitFullscreen();
				},
				enterPictureInPicture: () => {
					vRef.current?.requestPictureInPicture();
				},
				exitPictureInPicture: () => {
					document.exitPictureInPicture();
				},
				canEnterPictureInPicture: () => document.pictureInPictureEnabled,
			}),
			[],
		);

		return (
			<Video
				ref={vRef}
				controls={controls}
				style={[
					style,
					{ objectFit: resizeMode === "stretch" ? "fill" : resizeMode },
				]}
				{...props}
			/>
		);
	},
);

VideoView.displayName = "VideoView";

export default memo(VideoView);
