import React, {FC, memo} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import styles from '../styles.tsx';
import {srcList} from '../constants';
import {type AdditionalSourceInfo} from '../types';

type Props = {
  srcListId: number;
  showRNVControls: boolean;
  toggleControls: () => void;
};

const _TopControl: FC<Props> = ({
  toggleControls,
  showRNVControls,
  srcListId,
}) => {
  return (
    <View style={styles.topControlsContainer}>
      <Text style={styles.controlOption}>
        {(srcList[srcListId] as AdditionalSourceInfo)?.description ||
          'local file'}
      </Text>
      <View>
        <TouchableOpacity
          onPress={() => {
            toggleControls();
          }}>
          <Text style={styles.leftRightControlOption}>
            {showRNVControls ? 'Hide controls' : 'Show controls'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export const TopControl = memo(_TopControl);
