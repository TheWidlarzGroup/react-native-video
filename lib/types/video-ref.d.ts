import type { RefObject } from 'react';
import { ReactVideoSource } from './video';
export type VideoSaveData = {
    uri: string;
};
export interface VideoRef {
    seek: (time: number, tolerance?: number) => void;
    resume: () => void;
    pause: () => void;
    presentFullscreenPlayer: () => void;
    dismissFullscreenPlayer: () => void;
    restoreUserInterfaceForPictureInPictureStopCompleted: (restore: boolean) => void;
    save: (options: object) => Promise<VideoSaveData> | void;
    setVolume: (volume: number) => void;
    getCurrentPosition: () => Promise<number>;
    setFullScreen: (fullScreen: boolean) => void;
    setSource: (source?: ReactVideoSource) => void;
    enterPictureInPicture: () => void;
    exitPictureInPicture: () => void;
    nativeHtmlVideoRef?: RefObject<HTMLVideoElement | null>;
}
