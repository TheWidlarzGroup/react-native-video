import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoPlayer,
  VideoPlayerFactory,
} from '../spec/nitro/VideoPlayer.nitro';
import type { VideoPlayerSourceFactory } from '../spec/nitro/VideoPlayerSource.nitro';
import type { VideoConfig, VideoSource } from '../types/VideoConfig';
import { Image } from 'react-native';

// ----------- Factories -----------
const VideoPlayerSourceFactory =
  NitroModules.createHybridObject<VideoPlayerSourceFactory>(
    'VideoPlayerSourceFactory'
  );

const VideoPlayerFactory =
  NitroModules.createHybridObject<VideoPlayerFactory>('VideoPlayerFactory');

// ----------- Factories functions -----------
export const createPlayer = (
  source: VideoSource | VideoConfig
): VideoPlayer => {
  // If source is a string, we can directly create the player
  if (typeof source === 'string') {
    return VideoPlayerFactory.createPlayer(
      VideoPlayerSourceFactory.fromUri(source)
    );
  }

  // If source is a number (asset), we need to resolve the asset source and create the player
  if (typeof source === 'number') {
    return VideoPlayerFactory.createPlayer(
      VideoPlayerSourceFactory.fromUri(Image.resolveAssetSource(source).uri)
    );
  }

  // If source is an object (VideoConfig)
  if (typeof source === 'object' && 'uri' in source) {
    return createPlayer(source.uri);
  }

  throw new Error('RNV: Invalid source type');
};

export const createSource = (uri: string) => {
  return VideoPlayerSourceFactory.fromUri(uri);
};
