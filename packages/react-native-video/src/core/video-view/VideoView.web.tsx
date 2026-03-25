import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import { View } from "react-native";
import type { VideoPlayer } from "../VideoPlayer.web";
import type { VideoViewEvents } from "../types/Events";
import type { ListenerSubscription } from "../types/EventEmitter";
import type { VideoViewProps, VideoViewRef } from "./VideoViewProps";
import { createPlayer, videoFeatures, usePlayerContext, useMediaAttach } from "@videojs/react";
import { VideoSkin } from "@videojs/react/video";

// Create Player factory once at module level (v10 pattern)
const Player = createPlayer({ features: videoFeatures });

/**
 * Connects the VideoPlayer adapter's store to our adapter class
 * and mounts the existing HTMLVideoElement into the v10 Provider.
 */
function PlayerBridge({ player }: { player: VideoPlayer }) {
  const { store } = usePlayerContext();
  const setMedia = useMediaAttach();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Connect store to adapter
  useEffect(() => {
    player.__setStore(store);
    return () => player.__setStore(null);
  }, [store, player]);

  // Mount our existing video element and register with Provider
  useEffect(() => {
    const video = player.__getMedia();
    videoRef.current = video;
    setMedia?.(video);
    return () => setMedia?.(null);
  }, [player, setMedia]);

  return null;
}

/**
 * Mounts our video element into the DOM within the v10 Container.
 */
function VideoElement({ player, objectFit }: { player: VideoPlayer; objectFit: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = player.__getMedia();
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      objectFit,
    });
    video.playsInline = true;
    containerRef.current?.appendChild(video);
    return () => {
      if (video.parentNode === containerRef.current) {
        containerRef.current?.removeChild(video);
      }
    };
  }, [player, objectFit]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

const VideoView = forwardRef<VideoViewRef, VideoViewProps>(
  (
    {
      player: nPlayer,
      controls = false,
      resizeMode = "none",
      pictureInPicture = false,
      autoEnterPictureInPicture = false,
      keepScreenAwake = true,
      ...props
    },
    ref,
  ) => {
    const player = nPlayer as unknown as VideoPlayer;

    const objectFit: CSSProperties["objectFit"] =
      resizeMode === "stretch" ? "fill" : resizeMode;

    useImperativeHandle(
      ref,
      () => ({
        enterFullscreen: () => {
          document.documentElement.requestFullscreen?.();
        },
        exitFullscreen: () => {
          document.exitFullscreen?.();
        },
        enterPictureInPicture: () => {
          player.__getMedia()?.requestPictureInPicture?.();
        },
        exitPictureInPicture: () => {
          document.exitPictureInPicture?.();
        },
        canEnterPictureInPicture: () =>
          document.pictureInPictureEnabled ?? false,
        addEventListener: <Event extends keyof VideoViewEvents>(
          _event: Event,
          _callback: VideoViewEvents[Event],
        ): ListenerSubscription => {
          return { remove: () => {} };
        },
      }),
      [player],
    );

    return (
      <View {...props}>
        <Player.Provider>
          <PlayerBridge player={player} />
          <Player.Container
            style={{
              position: "absolute",
              inset: "0",
              width: "100%",
              height: "100%",
            }}
          >
            {controls ? (
              <VideoSkin>
                <VideoElement player={player} objectFit={objectFit} />
              </VideoSkin>
            ) : (
              <VideoElement player={player} objectFit={objectFit} />
            )}
          </Player.Container>
        </Player.Provider>
      </View>
    );
  },
);

VideoView.displayName = "VideoView";

export default memo(VideoView);
