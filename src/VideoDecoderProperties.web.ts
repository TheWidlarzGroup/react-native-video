/// <reference lib="dom" />
import type {VideoDecoderInfoModuleType} from './specs/NativeVideoDecoderInfoModule';

const canPlay = (codec: string): boolean => {
  // most chrome based browser (and safari I think) supports matroska but reports they do not.
  // for those browsers, only check the codecs and not the container.
  if (navigator.userAgent.search('Firefox') === -1) {
    codec = codec.replace('video/x-matroska', 'video/mp4');
  }

  return !!MediaSource.isTypeSupported(codec);
};

export const VideoDecoderProperties = {
  async getWidevineLevel() {
    return 0;
  },

  async isCodecSupported(
    mimeType: string,
    _width: number,
    _height: number,
  ): Promise<'unsupported' | 'hardware' | 'software'> {
    // TODO: Figure out if we can get hardware support information
    return canPlay(mimeType) ? 'software' : 'unsupported';
  },

  async isHEVCSupported(): Promise<'unsupported' | 'hardware' | 'software'> {
    // Just a dummy vidoe mime type codec with HEVC to check.
    return canPlay('video/x-matroska; codecs="hvc1.1.4.L96.BO"')
      ? 'software'
      : 'unsupported';
  },
} satisfies VideoDecoderInfoModuleType;
