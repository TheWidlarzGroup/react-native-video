import { NitroModules } from 'react-native-nitro-modules';
import type { VideoPlayerSourceFactory } from './spec/nitro/VideoPlayerSource.nitro';
import type { VideoPlayerFactory } from './spec/nitro/VideoPlayer.nitro';

export { default as VideoView } from './VideoView';
export type { VideoPlayer } from './spec/nitro/VideoPlayer.nitro';

const VideoPlayerSourceFactory =
  NitroModules.createHybridObject<VideoPlayerSourceFactory>(
    'VideoPlayerSourceFactory'
  );

const VideoPlayerFactory =
  NitroModules.createHybridObject<VideoPlayerFactory>('VideoPlayerFactory');

export const createPlayer = (uri: string) => {
  const source = VideoPlayerSourceFactory.fromUri(uri);
  return VideoPlayerFactory.createPlayer(source);
};
