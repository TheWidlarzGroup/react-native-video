import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  seekCmd(reactTag: number, time: number, tolerance?: number): Promise<void>;
  setPlayerPauseStateCmd(reactTag: number, paused: boolean): Promise<void>;
  setLicenseResultCmd(
    reactTag: number,
    result: string,
    licenseUrl: string,
  ): Promise<void>;
  setLicenseResultErrorCmd(
    reactTag: number,
    error: string,
    licenseUrl: string,
  ): Promise<void>;
  setFullScreenCmd(reactTag: number, fullScreen: boolean): Promise<void>;
  setSourceCmd(reactTag: number, source?: Object): Promise<void>;
  setVolumeCmd(reactTag: number, volume: number): Promise<void>;
  enterPictureInPictureCmd(reactTag: number): Promise<void>;
  exitPictureInPictureCmd(reactTag: number): Promise<void>;
  save(reactTag: number, option: Object): Promise<Object>;
  getCurrentPosition(reactTag: number): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('VideoManager') as Spec | null;
