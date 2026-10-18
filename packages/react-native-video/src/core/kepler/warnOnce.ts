const warned = new Set<string>();

/** Warns once per app run about a feature Vega does not support. */
export function warnOnce(feature: string): void {
  if (warned.has(feature)) return;
  warned.add(feature);
  console.warn(`[react-native-video] ${feature} is not supported on Vega yet.`);
}
