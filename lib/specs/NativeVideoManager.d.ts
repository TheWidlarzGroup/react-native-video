import type { Int32, Float, UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import type { VideoSaveData } from '../types/video-ref';
export interface VideoManagerType {
    seekCmd: (reactTag: Int32, time: Float, tolerance?: Float) => Promise<void>;
    setPlayerPauseStateCmd: (reactTag: Int32, paused: boolean) => Promise<void>;
    setLicenseResultCmd: (reactTag: Int32, result: string, licenseUrl: string) => Promise<void>;
    setLicenseResultErrorCmd: (reactTag: Int32, error: string, licenseUrl: string) => Promise<void>;
    setFullScreenCmd: (reactTag: Int32, fullScreen: boolean) => Promise<void>;
    setSourceCmd: (reactTag: Int32, source?: UnsafeObject) => Promise<void>;
    setVolumeCmd: (reactTag: Int32, volume: number) => Promise<void>;
    enterPictureInPictureCmd: (reactTag: number) => Promise<void>;
    exitPictureInPictureCmd: (reactTag: number) => Promise<void>;
    save: (reactTag: Int32, option: UnsafeObject) => Promise<VideoSaveData>;
    getCurrentPosition: (reactTag: Int32) => Promise<Int32>;
}
declare const _default: VideoManagerType;
export default _default;
