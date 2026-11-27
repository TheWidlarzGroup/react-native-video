import {NativeModules} from 'react-native';
import type {
  Int32,
  Float,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';
import type {VideoSaveData} from '../types/video-ref';

// @TODO rename to "Spec" when applying new arch
export interface VideoManagerType {
  seekCmd: (reactTag: Int32, time: Float, tolerance?: Float) => void;
  setPlayerPauseStateCmd: (reactTag: Int32, paused: boolean) => void;
  setLicenseResultCmd: (
    reactTag: Int32,
    result: string,
    licenseUrl: string,
  ) => void;
  setLicenseResultErrorCmd: (
    reactTag: Int32,
    error: string,
    licenseUrl: string,
  ) => void;
  setFullScreenCmd: (reactTag: Int32, fullScreen: boolean) => void;
  setSourceCmd: (reactTag: Int32, source?: UnsafeObject) => void;
  setVolumeCmd: (reactTag: Int32, volume: number) => void;
  enterPictureInPictureCmd: (reactTag: Int32) => void;
  exitPictureInPictureCmd: (reactTag: Int32) => void;
  save?: (reactTag: Int32, option: UnsafeObject) => Promise<VideoSaveData>;
  getCurrentPosition: (reactTag: Int32) => Promise<number>;
}

export default NativeModules.VideoManager as VideoManagerType;
