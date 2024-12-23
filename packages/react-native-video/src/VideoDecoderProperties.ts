import {Platform} from 'react-native';

import NativeVideoDecoderInfoModule from './specs/NativeVideoDecoderInfoModule';

const errMsgGen = (moduleName: string, propertyName: string) =>
  `The method or property ${moduleName}.${propertyName} is not available on ${Platform.OS}.`;

export const VideoDecoderProperties = {
  async getWidevineLevel() {
    if (Platform.OS !== 'android') {
      throw new Error(errMsgGen('VideoDecoderProperties', 'getWidevineLevel'));
    }
    return NativeVideoDecoderInfoModule.getWidevineLevel();
  },
  async isCodecSupported(
    ...args: Parameters<typeof NativeVideoDecoderInfoModule.isCodecSupported>
  ) {
    if (Platform.OS !== 'android') {
      throw new Error(errMsgGen('VideoDecoderProperties', 'isCodecSupported'));
    }
    return NativeVideoDecoderInfoModule.isCodecSupported(...args);
  },
  async isHEVCSupported() {
    if (Platform.OS !== 'android') {
      throw new Error(errMsgGen('VideoDecoderProperties', 'isHEVCSupported'));
    }
    return NativeVideoDecoderInfoModule.isHEVCSupported();
  },
};
