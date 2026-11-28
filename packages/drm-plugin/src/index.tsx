import { NitroModules } from 'react-native-nitro-modules';
import type { PluginManager as PluginManagerSpec } from './PluginManager.nitro';

const PluginManager =
  NitroModules.createHybridObject<PluginManagerSpec>('PluginManager');

/**
 * Whether the plugin is registered with react-native-video. The native side enables it
 * when the module loads. A live binding: it follows `enable()` and `disable()`, so read it
 * where you need it instead of copying it into a constant at import time.
 */
export let isEnabled: boolean = PluginManager.isEnabled;

export function enable() {
  PluginManager.enable();
  isEnabled = PluginManager.isEnabled;
}

export function disable() {
  PluginManager.disable();
  isEnabled = PluginManager.isEnabled;
}
