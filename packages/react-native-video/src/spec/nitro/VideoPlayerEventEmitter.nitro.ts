import type { HybridObject } from 'react-native-nitro-modules';
import type { VideoPlayerEvents } from '../../core/types/Events';

/**
 * The holder of the video player events.
 * @platform iOS
 * @platform android
 */
export interface VideoPlayerEventEmitter
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }>,
    // For some magical reason, xcode builds fails if we make all events optional.
    // For now they are initialized with empty functions (NOOP)
    VideoPlayerEvents {}
