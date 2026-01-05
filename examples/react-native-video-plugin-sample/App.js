/**
 * Sample React Native App for Video Plugin Sample
 * Windows Win32 Demo
 */

import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
} from 'react-native';
import Video from 'react-native-video';

const App = () => {
  const [paused, setPaused] = useState(true);
  const videoRef = useRef(null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>React Native Video Plugin Sample</Text>
        <Text style={styles.subtitle}>Windows Win32 Application</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video Player</Text>
          
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{
                uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              }}
              style={styles.video}
              paused={paused}
              controls={false}
              resizeMode="contain"
            />
          </View>

          <View style={styles.videoControls}>
            <Button
              title={paused ? 'Play' : 'Pause'}
              onPress={() => setPaused(!paused)}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About This Sample</Text>
          <Text style={styles.infoText}>
            This is a Windows Win32 desktop application built with React Native.
            It demonstrates a plugin sample for react-native-video running on Windows.
          </Text>
          <Text style={styles.infoText}>
            The sample showcases how to integrate react-native-video in a plugin architecture,
            providing a foundation for building video-related extensions.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoCard: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    marginTop: 10,
  },
});

export default App;
