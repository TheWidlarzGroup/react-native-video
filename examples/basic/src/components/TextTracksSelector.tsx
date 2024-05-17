import {Picker} from '@react-native-picker/picker';
import {Text} from 'react-native';
import {TextTrack, SelectedTrack} from 'react-native-video';
import styles from '../styles';
import React from 'react';

export interface TextTrackSelectorType {
  textTracks: Array<TextTrack>;
  selectedTextTrack: SelectedTrack | undefined;
  onValueChange: (arg0: string) => void;
  textTracksSelectionBy: string;
}

const TextTrackSelector = ({
  textTracks,
  selectedTextTrack,
  onValueChange,
  textTracksSelectionBy,
}: TextTrackSelectorType) => {
  return (
    <>
      <Text style={styles.controlOption}>TextTrack</Text>
      <Picker
        style={styles.picker}
        itemStyle={styles.pickerItem}
        selectedValue={`${selectedTextTrack?.value}`}
        onValueChange={itemValue => {
          if (itemValue !== 'empty') {
            onValueChange(itemValue);
          }
        }}>
        {textTracks?.length <= 0 ? (
          <Picker.Item label={'empty'} value={'empty'} key={'empty'} />
        ) : (
          <Picker.Item label={'none'} value={'none'} key={'none'} />
        )}
        {textTracks.map(track => {
          if (!track) {
            return;
          }
          if (textTracksSelectionBy === 'index') {
            return (
              <Picker.Item
                label={`${track.index}`}
                value={track.index}
                key={track.index}
              />
            );
          } else {
            return (
              <Picker.Item
                label={track.language}
                value={track.language}
                key={track.language}
              />
            );
          }
        })}
      </Picker>
    </>
  );
};

export default TextTrackSelector;
