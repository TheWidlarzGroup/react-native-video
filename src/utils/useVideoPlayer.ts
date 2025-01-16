import type { VideoPlayer } from "../spec/nitro/VideoPlayer.nitro";
import { useReleasingHybridObject } from "./useReleasingHybridObject";
import { createPlayer } from "./factory";
import type { VideoSource } from "../types/VideoConfig";

/**
 * A hook that creates and manages a video player.
 * 
 * @param source - The source of the video.
 * @param setup - A function that allow to setup the video player after it is created.
 * @returns VideoPlayer (see {@link VideoPlayer})
 */
export const useVideoPlayer = (
    source: VideoSource,
    setup: (player: VideoPlayer) => void | undefined
) => {
    return useReleasingHybridObject(
        () => {
            const videoPlayer = createPlayer(source);
            setup?.(videoPlayer);
            return videoPlayer;
        },
        [source]
    );
}