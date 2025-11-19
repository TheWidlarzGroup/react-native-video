import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';

interface EventLog {
  id: string;
  timestamp: number;
  type: string;
  data: unknown;
  readableTime: string;
}

interface EventLoggerProps {
  events: EventLog[];
  isVisible: boolean;
}

export function EventLogger({events, isVisible}: EventLoggerProps) {
  if (!isVisible) {
    return null;
  }

  const renderEventItem = ({item: event}: {item: EventLog}) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTime}>{event.readableTime}</Text>
        <Text style={styles.eventType}>{event.type}</Text>
      </View>
      <Text style={styles.eventData}>
        {JSON.stringify(event.data, null, 2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>Event Log ({events.length} events)</Text>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        style={styles.debugScrollView}
        contentContainerStyle={styles.debugScrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  debugTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugScrollView: {
    height: 440,
  },
  debugScrollContent: {
    paddingBottom: 8,
  },
  eventItem: {
    backgroundColor: '#2a2a2a',
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  eventType: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventData: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
