import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
export interface VideoDecoderInfoModuleType {
    getWidevineLevel: () => Promise<Int32>;
    isCodecSupported: (mimeType: string, width: Int32, height: Int32) => Promise<'unsupported' | 'hardware' | 'software'>;
    isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}
declare const _default: VideoDecoderInfoModuleType;
export default _default;
