import React, {FC, memo} from 'react';
import {ActivityIndicator, View} from 'react-native';
import styles from '../styles.tsx';

type Props = {
  isLoading: boolean;
};

const _Indicator: FC<Props> = ({isLoading}) => {
  if (!isLoading) {
    return <View />;
  }
  return (
    <ActivityIndicator
      color="#3235fd"
      size="large"
      style={styles.IndicatorStyle}
    />
  );
};

export const Indicator = memo(_Indicator);
