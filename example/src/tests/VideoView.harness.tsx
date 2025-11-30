import React from 'react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  render,
} from 'react-native-harness';
import { VideoPlayer, VideoView } from 'react-native-video';

const waitMs = async (time: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, time));
};

describe('VideoView Tests', () => {
  let TEST_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

  let player: VideoPlayer;

  beforeEach(async () => {
    player = new VideoPlayer({
      uri: TEST_VIDEO_URL,
    });

    console.log('Initializing player for tests');

    // wait for player initialization
    await waitMs(1000);
    console.log('Player initialized for tests');
  });

  afterEach(() => {
    console.log('Releasing player after tests');
    player.release();
  });

  it('should render VideoView correctly', async () => {
    console.log('Rendering VideoView for tests');
    await render(
      <VideoView player={player} style={{ width: 300, height: 200 }} />
    );

    console.log('VideoView rendered for tests');

    await waitMs(1);

    console.log('VideoView test completed');

    // Test passes if no errors are thrown during rendering
    expect(true).toBe(true);
  });
});
