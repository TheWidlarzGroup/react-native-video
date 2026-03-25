import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  type CSSProperties,
} from "react";
import { View } from "react-native";
import type { VideoPlayer } from "../VideoPlayer.web";
import type { VideoViewEvents } from "../types/Events";
import type { ListenerSubscription } from "../types/EventEmitter";
import type { VideoViewProps, VideoViewRef } from "./VideoViewProps";
import { createPlayer, videoFeatures, usePlayerContext, useMediaAttach } from "@videojs/react";
import { VideoSkin } from "@videojs/react/video";
import "@videojs/react/video/skin.css";
import type { VideoStore } from "../web/WebEventEmitter";

const Player = createPlayer({ features: videoFeatures });

/**
 * Attaches the adapter's pre-existing <video> element to the video.js store,
 * then passes the ready store to the adapter.
 */
function PlayerBridge({ player }: { player: VideoPlayer }) {
  const { store: rawStore, container } = usePlayerContext();
  const store = rawStore as unknown as VideoStore;
  const setMedia = useMediaAttach();

  useEffect(() => {
    if (!container) return;

    const video = player.__getMedia();
    setMedia?.(video);
    const detach = store.attach({ media: video, container });
    player.__setStore(store);

    return () => {
      player.__setStore(null);
      detach?.();
      setMedia?.(null);
    };
  }, [store, player, setMedia, container]);

  return null;
}

/**
 * Mounts the adapter's <video> element into the DOM via ref callback.
 * The element is created in VideoPlayer constructor so it already has
 * source and event listeners attached.
 */
function VideoElement({ player, objectFit }: { player: VideoPlayer; objectFit: string }) {
  const mountRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return;
      const video = player.__getMedia();
      Object.assign(video.style, { width: "100%", height: "100%", objectFit });
      if (video.parentNode !== container) {
        container.appendChild(video);
      }
    },
    [player, objectFit],
  );

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
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

    const objectFitMap: Record<string, CSSProperties["objectFit"]> = {
      contain: "contain",
      cover: "cover",
      stretch: "fill",
      none: "contain",
    };
    const objectFit = objectFitMap[resizeMode] ?? "contain";

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

    const videoContent = <VideoElement player={player} objectFit={objectFit} />;

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
            {controls ? <VideoSkin>{videoContent}</VideoSkin> : videoContent}
          </Player.Container>
        </Player.Provider>
      </View>
    );
  },
);

VideoView.displayName = "VideoView";

export default memo(VideoView);
