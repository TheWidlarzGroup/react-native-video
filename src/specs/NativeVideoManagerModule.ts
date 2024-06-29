import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
import type {
  Int32,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export type VideoSaveData = {
  uri: string;
};

export interface NativeVideoManagerModuleSpec extends TurboModule {
  save: (reactTag: Int32, option: UnsafeObject) => Promise<VideoSaveData>;
  getCurrentPosition: (reactTag: Int32) => Promise<Int32>;
}

export default TurboModuleRegistry.getEnforcing<NativeVideoManagerModuleSpec>(
  'VideoManager',
);
