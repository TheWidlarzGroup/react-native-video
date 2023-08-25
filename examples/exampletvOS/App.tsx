import React from 'react';

import {ActivityIndicator, StyleSheet} from 'react-native';

import Video from 'react-native-video';

export default function App() {
  return (
    <>
      <ActivityIndicator style={styles.activityIndicator} size={'large'} />
      <Video
        source={{
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          // uri: 'https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8',
          // type: 'm3u8',
        }}
        style={[styles.fullScreen, StyleSheet.absoluteFillObject]}
        controls
        fullscreen
        resizeMode={'contain'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  activityIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
