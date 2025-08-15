import { NitroModules } from 'react-native-nitro-modules';
import type { PluginManager as PluginManagerSpec } from './PluginManager.nitro';

const PluginManager =
  NitroModules.createHybridObject<PluginManagerSpec>('PluginManager');

export function enable() {
  return PluginManager.enable();
}

export function disable() {
  return PluginManager.disable();
}

export const isEnabled: boolean = PluginManager.isEnabled;
