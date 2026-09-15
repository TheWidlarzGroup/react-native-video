import React, { useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { eventLog, MARKER_IDS } from './eventLog';

/**
 * Renders:
 *  1) one <Text testID={marker}> per marker that has fired — Maestro:
 *     `assertVisible: { id: "evt-onLoad" }` (extendedWaitUntil for async ones)
 *  2) error code as text with testID "evt-error-code" (e.g. to assert a specific code)
 *  3) chronological log (debug aid; visible in CI screenshots/recordings)
 *
 * Keep it mounted on every scenario screen, below the VideoView.
 */
export function EventLogPanel() {
  const markers = useSyncExternalStore(eventLog.subscribe, eventLog.getMarkers);
  const entries = useSyncExternalStore(eventLog.subscribe, eventLog.getEntries);
  const errorCode = useSyncExternalStore(
    eventLog.subscribe,
    eventLog.getErrorCode
  );

  return (
    <View style={styles.panel}>
      <View style={styles.markerRow}>
        {MARKER_IDS.filter((m) => markers.has(m)).map((m) => (
          <Text key={m} testID={m} style={styles.marker}>
            {m}
          </Text>
        ))}
      </View>
      {errorCode !== '' && (
        <Text testID="evt-error-code" style={styles.errorCode}>
          error-code:{errorCode}
        </Text>
      )}
      <ScrollView style={styles.log}>
        {entries.map(({ id, text }) => (
          <Text key={id} style={styles.logLine}>
            {text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, padding: 8 },
  markerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  marker: { fontSize: 11, color: 'green' },
  errorCode: { color: 'red', fontSize: 12 },
  log: { flex: 1, marginTop: 8 },
  logLine: { fontSize: 10, fontFamily: 'monospace' },
});
