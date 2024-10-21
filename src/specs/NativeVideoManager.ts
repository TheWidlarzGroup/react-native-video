import {NativeModules} from 'react-native';
import type {
  Int32,
  Float,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export type VideoSaveData = {
  uri: string;
};

// @TODO rename to "Spec" when applying new arch
export interface VideoManagerType {
  seekCmd: (reactTag: Int32, time: Float, tolerance?: Float) => Promise<void>;
  setPlayerPauseStateCmd: (reactTag: Int32, paused: boolean) => Promise<void>;
  setLicenseResultCmd: (
    reactTag: Int32,
    result: string,
    licenseUrl: string,
  ) => Promise<void>;
  setLicenseResultErrorCmd: (
    reactTag: Int32,
    error: string,
    licenseUrl: string,
  ) => Promise<void>;
  setFullScreenCmd: (reactTag: Int32, fullScreen: boolean) => Promise<void>;
  setVolumeCmd: (reactTag: Int32, volume: number) => Promise<void>;
  save: (reactTag: Int32, option: UnsafeObject) => Promise<VideoSaveData>;
  getCurrentPosition: (reactTag: Int32) => Promise<Int32>;
}

export default NativeModules.VideoManager as VideoManagerType;
