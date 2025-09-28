export { useEvent } from './core/hooks/useEvent';
export { useVideoPlayer } from './core/hooks/useVideoPlayer';
export type * from './core/types/Events';
export type { IgnoreSilentSwitchMode } from './core/types/IgnoreSilentSwitchMode';
export type { MixAudioMode } from './core/types/MixAudioMode';
export type { ResizeMode } from './core/types/ResizeMode';
export type { TextTrack } from './core/types/TextTrack';
export type { VideoConfig, VideoSource } from './core/types/VideoConfig';
export type {
  LibraryError,
  PlayerError,
  SourceError,
  UnknownError,
  VideoComponentError,
  VideoError,
  VideoErrorCode,
  VideoRuntimeError,
  VideoViewError,
} from './core/types/VideoError';
export type { VideoPlayerStatus } from './core/types/VideoPlayerStatus';

export { VideoPlayer } from './core/VideoPlayer';
export {
  default as VideoView,
  type VideoViewProps,
  type VideoViewRef,
} from './core/video-view/VideoView';
