import {Text, View} from 'react-native';
import {Indicator} from './Indicator.tsx';
import React, {memo} from 'react';
import styles from '../styles.tsx';

const _VideoLoader = () => {
  return (
    <View style={styles.indicatorContainer}>
      <Text style={styles.indicatorText}>Loading...</Text>
      <Indicator />
    </View>
  );
};

export const VideoLoader = memo(_VideoLoader);
