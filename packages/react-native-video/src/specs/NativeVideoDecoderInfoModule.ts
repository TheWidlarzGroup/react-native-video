import {NativeModules} from 'react-native';
import type {Int32} from 'react-native/Libraries/Types/CodegenTypes';

// @TODO rename to "Spec" when applying new arch
export interface VideoDecoderInfoModuleType {
  getWidevineLevel: () => Promise<Int32>;
  isCodecSupported: (
    mimeType: string,
    width: Int32,
    height: Int32,
  ) => Promise<'unsupported' | 'hardware' | 'software'>;
  isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}

export default NativeModules.VideoDecoderInfoModule as VideoDecoderInfoModuleType;
