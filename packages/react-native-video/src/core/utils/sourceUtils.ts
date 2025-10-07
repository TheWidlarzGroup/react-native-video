import type { VideoPlayerSource } from "../../spec/nitro/VideoPlayerSource.nitro";

export const isVideoPlayerSource = (obj: any): obj is VideoPlayerSource => {
  return (
    obj && // obj is not null
    typeof obj === 'object' && // obj is an object
    'name' in obj && // obj has a name property
    obj.name === 'VideoPlayerSource' // obj.name is 'VideoPlayerSource'
  );
};

