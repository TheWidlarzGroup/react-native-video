/**
 * Types for the two Vega SDK packages, limited to what the Vega backend uses.
 * Not devDependencies: their React pins conflict with this repo's React 18.3 / RN 0.77.
 * Apps type-check against the real packages.
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

  /** HTMLMediaElement on Vega's native player; call `initialize()` first. */
  export class VideoPlayer {
    constructor();
    initialize(): Promise<void>;
    deinitialize(): Promise<void>;
    setSurfaceHandle(handle: string): void;
    clearSurfaceHandle(handle: string): void;
    setMediaControlFocus(componentInstance: unknown): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    load(): void;
    removeAttribute(name: string): void;
    /** Not in older w3cmedia versions. */
    setSrcWithCustomHeaders?(
      url: string,
      headers?: Record<string, string>
    ): void;
    src: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    volume: number;
    playbackRate: number;
    currentTime: number;
    readonly duration: number;
    readonly paused: boolean;
    readonly seeking: boolean;
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
    addAppStateListener(
      event: 'change',
      listener: (state: unknown) => void
    ): { remove(): void };
  }
  export function useKeplerAppStateManager(): IKeplerAppStateManager;
}
