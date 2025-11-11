import type { HybridObject } from 'react-native-nitro-modules';

export interface PluginManager
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  enable(): void;
  disable(): void;
  readonly isEnabled: boolean;
}
