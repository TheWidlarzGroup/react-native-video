import type { AudioTrack } from "../types/AudioTrack";
import type { QualityLevel } from "../types/QualityLevel";
import type { TextTrack } from "../types/TextTrack";
import type { VideoTrack } from "../types/VideoTrack";
import {
  mapVideoJsTracks,
  type VideoJsPlayer,
  type VideoJsQualityArray,
  type VideoJsTextTracks,
  type VideoJsTracks,
} from "./WebVideoJsTypes";

type EmitFn = (event: string, ...args: unknown[]) => void;

/**
 * Attaches track change listeners to a video.js player and returns a cleanup function.
 * Handles text, audio, video track changes and quality level changes.
 */
export function attachTrackHandlers(
  player: VideoJsPlayer,
  emit: EmitFn,
): () => void {
  const onTextTrackChange = () => {
    // @ts-expect-error video.js defines length & index properties via prototype
    const tracks: VideoJsTextTracks = player.textTracks();
    const selected = mapVideoJsTracks(tracks, (track): TextTrack => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.mode === "showing",
    })).find((x) => x.selected);

    emit("onTrackChange", selected ?? null);
  };

  const onAudioTrackChange = () => {
    // @ts-expect-error video.js defines length & index properties via prototype
    const tracks: VideoJsTracks = player.audioTracks();
    const selected = mapVideoJsTracks(tracks, (track): AudioTrack => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.enabled,
    })).find((x) => x.selected);

    emit("onAudioTrackChange", selected ?? null);
  };

  const onVideoTrackChange = () => {
    // @ts-expect-error video.js defines length & index properties via prototype
    const tracks: VideoJsTracks = player.videoTracks();
    const selected = mapVideoJsTracks(tracks, (track): VideoTrack => ({
      id: track.id,
      label: track.label,
      language: track.language,
      selected: track.enabled,
    })).find((x) => x.selected);

    emit("onVideoTrackChange", selected ?? null);
  };

  const onQualityChange = () => {
    // @ts-expect-error qualityLevels is from videojs-contrib-quality-levels plugin
    const levels: VideoJsQualityArray = player.qualityLevels();
    if (levels.selectedIndex < 0) return;
    const quality = levels[levels.selectedIndex];
    if (!quality) return;

    emit("onQualityChange", {
      id: quality.id,
      width: quality.width,
      height: quality.height,
      bitrate: quality.bitrate,
      selected: true,
    } satisfies QualityLevel);
  };

  // Attach listeners
  player.textTracks().on("change", onTextTrackChange);
  player.audioTracks().on("change", onAudioTrackChange);
  player.videoTracks().on("change", onVideoTrackChange);
  // @ts-expect-error qualityLevels is from videojs-contrib-quality-levels plugin
  player.qualityLevels().on("change", onQualityChange);

  // Return cleanup function
  return () => {
    player.textTracks().off("change", onTextTrackChange);
    player.audioTracks().off("change", onAudioTrackChange);
    player.videoTracks().off("change", onVideoTrackChange);
    // @ts-expect-error qualityLevels is from videojs-contrib-quality-levels plugin
    player.qualityLevels().off("change", onQualityChange);
  };
}
