import type videojs from "video.js";

export type VideoJsPlayer = ReturnType<typeof videojs>;

export type VideoJsTextTracks = {
  length: number;
  [i: number]: {
    id: string;
    label: string;
    language: string;
    default: boolean;
    mode: "showing" | "disabled" | "hidden";
  };
};

export type VideoJsTracks = {
  length: number;
  [i: number]: {
    id: string;
    label: string;
    language: string;
    enabled: boolean;
  };
};

export type VideoJsQualityArray = {
  length: number;
  selectedIndex: number;
  [i: number]: {
    id: string;
    label: string;
    width: number;
    height: number;
    bitrate: number;
    frameRate: number;
    enabled: boolean;
  };
};

export function mapVideoJsTracks<T, R>(
  tracks: { length: number; [i: number]: T | undefined },
  mapper: (track: T, index: number) => R,
): R[] {
  const result: R[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track) {
      result.push(mapper(track, i));
    }
  }
  return result;
}
