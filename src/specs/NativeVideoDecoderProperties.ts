import {NativeModules} from 'react-native';
import type {Int32} from 'react-native/Libraries/Types/CodegenTypes';

export type VideoSaveData = {
  uri: string;
};

// @TODO rename to "Spec" when applying new arch
interface VideoDecoderPropertiesType {
  getWidevineLevel: () => Promise<Int32>;
  isCodecSupported: (
    mimeType: string,
    width: Int32,
    height: Int32,
  ) => Promise<'unsupported' | 'hardware' | 'software'>;
  isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}

export default NativeModules.VideoDecoderProperties as VideoDecoderPropertiesType;
