import React from 'react';
import Video, {type ReactVideoSource} from '../src';
import bundledVideo = require('./video.mp4');

export function AcceptedVideoSources() {
  return (
    <>
      <Video source={bundledVideo} />
      <Video source={{uri: bundledVideo}} />
      <Video source={{uri: require}} />
      <Video source={{uri: 'https://example.com/video.mp4'}} />
    </>
  );
}

// @ts-expect-error A boolean is not a valid source URI.
export const invalidUri: ReactVideoSource = {uri: true};

// @ts-expect-error Source arrays are not supported by Video.
export const invalidArraySource: ReactVideoSource = [bundledVideo];
