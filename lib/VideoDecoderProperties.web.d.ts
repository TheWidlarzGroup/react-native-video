/// <reference lib="dom" />
export declare const VideoDecoderProperties: {
    getWidevineLevel(): Promise<number>;
    isCodecSupported(mimeType: string, _width: number, _height: number): Promise<'unsupported' | 'hardware' | 'software'>;
    isHEVCSupported(): Promise<'unsupported' | 'hardware' | 'software'>;
};
