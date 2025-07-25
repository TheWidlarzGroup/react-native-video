export declare const VideoDecoderProperties: {
    getWidevineLevel(): Promise<number>;
    isCodecSupported(mimeType: string, width: number, height: number): Promise<"unsupported" | "hardware" | "software">;
    isHEVCSupported(): Promise<"unsupported" | "hardware" | "software">;
};
