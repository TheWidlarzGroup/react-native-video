import {
  AudioTrack,
  Drm,
  ReactVideoSource,
  ResizeMode,
  SelectedTrack,
  SelectedVideoTrack,
  TextTrack,
  TextTracks,
  VideoTrack,
} from 'react-native-video';

export type AdditionalSourceInfo = {
  textTracks: TextTracks;
  adTagUrl: string;
  description: string;
  drm: Drm;
  noView: boolean;
};

export type SampleVideoSource = ReactVideoSource | AdditionalSourceInfo;

export interface StateType {
  rate: number;
  volume: number;
  muted: boolean;
  resizeMode: ResizeMode;
  duration: number;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  paused: boolean;
  fullscreen: boolean;
  decoration: boolean;
  isLoading: boolean;
  audioTracks: Array<AudioTrack>;
  textTracks: Array<TextTrack>;
  videoTracks: Array<VideoTrack>;
  selectedAudioTrack: SelectedTrack | undefined;
  selectedTextTrack: SelectedTrack | undefined;
  selectedVideoTrack: SelectedVideoTrack;
  srcListId: number;
  loop: boolean;
  showRNVControls: boolean;
  useCache: boolean;
  poster?: string;
  showNotificationControls: boolean;
  isSeeking: boolean;
}
