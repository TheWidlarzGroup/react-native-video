import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  getWidevineLevel(): Promise<number>;
  isCodecSupported(
    mimeType: string,
    width: number,
    height: number,
  ): Promise<string>;
  isHEVCSupported(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>(
  'VideoDecoderInfoModule',
) as Spec | null;
