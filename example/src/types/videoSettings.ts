import type {
  IgnoreSilentSwitchMode,
  MixAudioMode,
  ResizeMode,
} from 'react-native-video';

export interface VideoSettings {
  show: boolean;
  videoType: 'hls' | 'mp4' | 'drm';
  volume: number;
  muted: boolean;
  rate: number;
  loop: boolean;
  showNativeControls: boolean;
  resizeMode: ResizeMode;
  mixAudioMode: MixAudioMode;
  ignoreSilentSwitchMode: IgnoreSilentSwitchMode;
  playInBackground: boolean;
  playWhenInactive: boolean;
  showNotificationControls: boolean;
}

export const defaultSettings: VideoSettings = {
  show: false,
  videoType: 'hls',
  volume: 1,
  muted: false,
  rate: 1,
  loop: false,
  showNativeControls: false,
  resizeMode: 'contain',
  mixAudioMode: 'auto',
  ignoreSilentSwitchMode: 'auto',
  playInBackground: true,
  playWhenInactive: false,
  showNotificationControls: true,
};
