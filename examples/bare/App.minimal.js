/**
 * Minimal Hello World app for testing Win32 build
 * @format
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function MinimalApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Win32!</Text>
      <Text style={styles.subtitle}>React Native Windows Bare Example</Text>
      <Text style={styles.description}>
        This is a Win32 application running React Native.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0078d7',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
});
