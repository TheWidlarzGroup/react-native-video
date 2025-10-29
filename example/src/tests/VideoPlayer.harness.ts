import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from 'react-native-harness';
import { VideoPlayer } from 'react-native-video';

const waitForNextTick = async (time: number = 0) => {
  await new Promise<void>((resolve) => setTimeout(resolve, time));
};

const waitFor = async (
  condition: () => boolean,
  timeout = 2000,
  debug: {
    log?: string;
  } = {}
) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return;
    await waitForNextTick(timeout < 100 ? timeout : 100);
  }

  throw new Error(
    'Timeout waiting for condition ' + (debug.log ? `: ${debug.log}` : '')
  );
};

describe('VideoPlayer Tests', () => {
  const TEST_VIDEO_URL = require('../assets/movie.mp4');
  const VIDEO_LOADING_TIMEOUT = 10000;

  describe('Status', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        // For testing purposes, we don't want to loading playback immediately
        initializeOnCreation: false,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should report correct initial status', async () => {
      expect(player.status).toBe('idle');
    });

    it('should transition to loading status when initialize is called', async () => {
      player.initialize();

      await waitFor(() => player.status === 'loading', 500, {
        log: `Expected player.status=loading - received player.status=${player.status}`,
      });

      expect(player.status).toBe('loading');
    });

    it('should transition to playing status after loading', async () => {
      player.initialize();

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      expect(player.status).toBe('readyToPlay');
    });
  });

  describe('Playback Control', () => {
    let player: VideoPlayer;

    beforeEach(() => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        initializeOnCreation: true,
      });
    });

    afterEach(() => {
      player.release();
    });

    it('should play the video', async () => {
      player.addEventListener('onStatusChange', (status) => {
        throw new Error('Status changed: ' + status);
      });

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      player.play();

      await waitFor(() => player.isPlaying === true, 2000, {
        log: `Expected player.isPlaying=true - received player.isPlaying=${player.isPlaying}`,
      });

      expect(player.isPlaying).toBe(true);
    });

    it('should pause the video', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      player.play();

      await waitFor(() => player.isPlaying === true, 2000, {
        log: `Expected player.isPlaying=true - received player.isPlaying=${player.isPlaying}`,
      });

      player.pause();

      await waitFor(() => player.isPlaying === false, 2000, {
        log: `Expected player.isPlaying=false - received player.isPlaying=${player.isPlaying}`,
      });

      expect(player.isPlaying).toBe(false);
    });

    it('should seek to a specific time', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      player.seekTo(5);

      await waitFor(() => player.currentTime >= 5, 2000, {
        log: `Expected player.currentTime >= 5 - received player.currentTime=${player.currentTime}`,
      });

      expect(player.currentTime).toBeGreaterThanOrEqual(5);
    });

    it('should seek by a relative amount', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      const initialTime = player.currentTime;

      player.seekBy(3);

      await waitFor(() => player.currentTime >= initialTime + 3, 2000, {
        log: `Expected player.currentTime >= ${initialTime + 3} - received player.currentTime=${player.currentTime}`,
      });

      expect(player.currentTime).toBeGreaterThanOrEqual(initialTime + 3);
    });
  });

  describe('Volume and Audio', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should set and get volume', async () => {
      player.volume = 0.5;

      expect(player.volume).toBe(0.5);
    });

    it('should set and get muted state', async () => {
      player.muted = true;

      expect(player.muted).toBe(true);

      player.muted = false;

      expect(player.muted).toBe(false);
    });
  });

  describe('Playback Properties', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should set and get loop state', async () => {
      player.loop = true;

      expect(player.loop).toBe(true);

      player.loop = false;

      expect(player.loop).toBe(false);
    });

    it('should set and get playback rate', async () => {
      player.rate = 1.5;

      expect(player.rate).toBe(1.5);

      player.rate = 1.0;

      expect(player.rate).toBe(1.0);
    });

    it('should set and get current time', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      player.currentTime = 3;

      await waitFor(() => player.currentTime >= 3, 2000, {
        log: `Expected player.currentTime >= 3 - received player.currentTime=${player.currentTime}`,
      });

      expect(player.currentTime).toBeGreaterThanOrEqual(3);
    });

    it('should get video duration', async () => {
      await waitFor(() => player.duration > 0, 10000, {
        log: `Expected player.duration > 0 - received player.duration=${player.duration}`,
      });

      expect(player.duration).toBeGreaterThan(0);
    });
  });

  describe('Background and Inactive Play', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should set and get play in background state', async () => {
      player.playInBackground = true;

      expect(player.playInBackground).toBe(true);

      player.playInBackground = false;

      expect(player.playInBackground).toBe(false);
    });

    it('should set and get play when inactive state', async () => {
      player.playWhenInactive = true;

      expect(player.playWhenInactive).toBe(true);

      player.playWhenInactive = false;

      expect(player.playWhenInactive).toBe(false);
    });

    it('should set and get show notification controls state', async () => {
      player.showNotificationControls = true;

      expect(player.showNotificationControls).toBe(true);

      player.showNotificationControls = false;

      expect(player.showNotificationControls).toBe(false);
    });
  });

  describe('Source Management', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        initializeOnCreation: false,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should get the source', async () => {
      const source = player.source;

      expect(source).toBeDefined();
    });

    it('should replace source with a new video', async () => {
      await player.initialize();

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      const newSource = {
        uri: TEST_VIDEO_URL,
      };

      await player.replaceSourceAsync(newSource);

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay after replacing source - received player.status=${player.status}`,
        }
      );

      expect(player.source).toBeDefined();
    });

    it('should replace source with null to release resources', async () => {
      await player.initialize();

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      await player.replaceSourceAsync(null);

      // Status should transition to idle after source is replaced with null
      await waitFor(() => player.status === 'idle', 2000, {
        log: `Expected player.status=idle after replacing source with null - received player.status=${player.status}`,
      });

      expect(player.status).toBe('idle');
    });
  });

  describe('Text Tracks', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should get available text tracks', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      const tracks = player.getAvailableTextTracks();

      expect(Array.isArray(tracks)).toBe(true);
    });

    it('should get selected track', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      const selectedTrack = player.selectedTrack;

      // selectedTrack can be undefined if no track is selected
      expect(
        selectedTrack === undefined || typeof selectedTrack === 'object'
      ).toBe(true);
    });

    it('should select a text track', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      const tracks = player.getAvailableTextTracks();

      if (tracks.length > 0) {
        const firstTrack = tracks[0];
        if (firstTrack) {
          player.selectTextTrack(firstTrack);

          expect(player.selectedTrack).toBeDefined();
        }
      }
    });

    it('should deselect text track by passing null', async () => {
      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      player.selectTextTrack(null);

      expect(
        player.selectedTrack === undefined || player.selectedTrack === null
      ).toBe(true);
    });
  });

  describe('Initialization Methods', () => {
    let player: VideoPlayer;

    beforeEach(async () => {
      player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        initializeOnCreation: false,
      });
    });

    afterEach(async () => {
      player.release();
    });

    it('should initialize player successfully', async () => {
      await player.initialize();

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      expect(player.status).toBe('readyToPlay');
    });

    it('should preload player without playing', async () => {
      await player.preload();

      await waitFor(
        () => player.status === 'readyToPlay',
        VIDEO_LOADING_TIMEOUT,
        {
          log: `Expected player.status=readyToPlay - received player.status=${player.status}`,
        }
      );

      expect(player.isPlaying).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should release player and cleanup resources', async () => {
      const player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        initializeOnCreation: false,
      });

      expect(player.status).toBe('idle');

      player.release();

      // After release, player should not be usable
      // Accessing properties should throw or return invalid state
    });

    it('should create player with VideoSource', async () => {
      const player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
      });

      expect(player).toBeDefined();

      player.release();
    });

    it('should create player with VideoConfig', async () => {
      const player = new VideoPlayer({
        uri: TEST_VIDEO_URL,
        metadata: {
          title: 'Test Video',
        },
      });

      expect(player).toBeDefined();

      player.release();
    });
  });
});
