import { NativeModules } from 'react-native';

const LINKING_ERROR =
  `RNDatazoom native module not found.\n` +
  `• Android: rebuild the app (native change).\n` +
  `• iOS: run "cd ios && pod install" then rebuild.\n` +
  `• Names must match: NativeModules.RNDatazoom.\n` +
  `• If using Expo Go, use a custom dev client.`;

const Native = NativeModules?.RNDatazoom ?? null;

export type InitOptions = {
  apiKey?: string;
};

export async function initialize(options?: InitOptions): Promise<void> {
  if (!Native) throw new Error(LINKING_ERROR);
  if (typeof Native.initialize === 'function') {
    await Native.initialize(options ?? {});
  }
}

export function isAvailable() {
  return !!Native;
}
