import { Image } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoPlayerSource,
  VideoPlayerSourceFactory,
} from '../../spec/nitro/VideoPlayerSource.nitro';
import type { VideoConfig, VideoSource } from '../types/VideoConfig';

const VideoPlayerSourceFactory =
  NitroModules.createHybridObject<VideoPlayerSourceFactory>(
    'VideoPlayerSourceFactory'
  );

export const isVideoPlayerSource = (obj: any): obj is VideoPlayerSource => {
  return (
    obj && // obj is not null
    typeof obj === 'object' && // obj is an object
    'name' in obj && // obj has a name property
    obj.name === 'VideoPlayerSource' // obj.name is 'VideoPlayerSource'
  );
};

export const createSourceFromUri = (uri: string) => {
  return VideoPlayerSourceFactory.fromUri(uri);
};

export const createSource = (
  source: VideoSource | VideoConfig | VideoPlayerSource
): VideoPlayerSource => {
  // If source is a VideoPlayerSource, we can directly return it
  if (isVideoPlayerSource(source)) {
    return source;
  }

  // If source is a string, we can directly create the player
  if (typeof source === 'string') {
    return createSourceFromUri(source);
  }

  // If source is a number (asset), we need to resolve the asset source and create the player
  if (typeof source === 'number') {
    return createSourceFromUri(Image.resolveAssetSource(source).uri);
  }

  // If source is an object (VideoConfig)
  if (typeof source === 'object' && 'uri' in source) {
    return createSource(source.uri);
  }

  throw new Error('RNV: Invalid source type');
};
