/**
 * The parts of the Vega SDK packages that the Vega backend uses. Both packages are in every
 * Vega app and are not on other platforms, so the library declares the few members it needs
 * instead of depending on them.
 */
declare module '@amazon-devices/react-native-w3cmedia' {
  import type { ComponentType } from 'react';
  import type { ViewStyle } from 'react-native';

  export interface MediaError {
    readonly code: number;
    readonly message?: string;
  }

  export interface TimeRanges {
    readonly length: number;
    start(index: number): number;
    end(index: number): number;
  }

  /** HTMLMediaElement on Vega's native media player. Nothing works before `initialize()`. */
  export class VideoPlayer {
    constructor();
    initialize(): Promise<void>;
    deinitialize(): Promise<void>;
    setSurfaceHandle(handle: string): void;
    clearSurfaceHandle(handle: string): void;
    setMediaControlFocus(componentInstance: unknown): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    src: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    volume: number;
    playbackRate: number;
    currentTime: number;
    readonly duration: number;
    readonly paused: boolean;
    readonly readyState: number;
    readonly videoWidth: number;
    readonly videoHeight: number;
    readonly buffered: TimeRanges;
    readonly error: MediaError | null;
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
  }

  export interface KeplerVideoSurfaceViewProps {
    style?: ViewStyle;
    scalingmode?: 'fit' | 'fill' | 'strech' | 'none';
    onSurfaceViewCreated: (handle: string) => void;
    onSurfaceViewDestroyed: (handle: string) => void;
  }

  export const KeplerVideoSurfaceView: ComponentType<KeplerVideoSurfaceViewProps>;
}

declare module '@amazon-devices/react-native-kepler' {
  export interface IKeplerAppStateManager {
    /** The app's component instance, for `setMediaControlFocus`. */
    getComponentInstance(): unknown;
  }
  export function useKeplerAppStateManager(): IKeplerAppStateManager;
}
