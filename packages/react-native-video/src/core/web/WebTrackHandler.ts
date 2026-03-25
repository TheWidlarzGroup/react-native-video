import type { TextTrack } from "../types/TextTrack";
import {
  mapVideoJsTracks,
  type VideoJsPlayer,
  type VideoJsTextTracks,
} from "./WebVideoJsTypes";

type EmitFn = (event: string, ...args: unknown[]) => void;

/**
 * Attaches track change listeners to a video.js player and returns a cleanup function.
 * Handles text track changes.
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

  // Attach listeners
  player.textTracks().on("change", onTextTrackChange);

  // Return cleanup function
  return () => {
    player.textTracks().off("change", onTextTrackChange);
  };
}
