const warned = new Set<string>();

/** Names a feature Vega cannot honour, once per app run. */
export function warnOnce(feature: string): void {
  if (warned.has(feature)) return;
  warned.add(feature);
  console.warn(`[react-native-video] ${feature} is not supported on Vega yet.`);
}
