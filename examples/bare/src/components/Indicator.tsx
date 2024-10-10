import React, {memo} from 'react';
import {ActivityIndicator} from 'react-native';

const _Indicator = () => {
  return <ActivityIndicator color="#3235fd" size="large" />;
};

export const Indicator = memo(_Indicator);
