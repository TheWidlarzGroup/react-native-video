import {Picker} from '@react-native-picker/picker';
import {Text} from 'react-native';
import {
  SelectedTrackType,
  type AudioTrack,
  type SelectedTrack,
} from 'react-native-video';
import styles from '../styles';
import React from 'react';

export interface AudioTrackSelectorType {
  audioTracks: Array<AudioTrack>;
  selectedAudioTrack: SelectedTrack | undefined;
  onValueChange: (arg0: string | number) => void;
  audioTracksSelectionBy: SelectedTrackType;
}

export const AudioTrackSelector = ({
  audioTracks,
  selectedAudioTrack,
  onValueChange,
  audioTracksSelectionBy,
}: AudioTrackSelectorType) => {
  return (
    <>
      <Text style={styles.controlOption}>AudioTrack</Text>
      <Picker
        style={styles.picker}
        itemStyle={styles.pickerItem}
        selectedValue={selectedAudioTrack?.value}
        onValueChange={itemValue => {
          if (itemValue !== 'empty') {
            console.log('on audio value change ' + itemValue);
            onValueChange(itemValue);
          }
        }}>
        {audioTracks?.length <= 0 ? (
          <Picker.Item label={'empty'} value={'empty'} key={'empty'} />
        ) : (
          <Picker.Item label={'none'} value={'none'} key={'none'} />
        )}
        {audioTracks.map(track => {
          if (!track) {
            return;
          }
          let value;
          if (audioTracksSelectionBy === SelectedTrackType.INDEX) {
            value = track.index;
          } else if (audioTracksSelectionBy === SelectedTrackType.LANGUAGE) {
            value = track.language;
          } else if (audioTracksSelectionBy === SelectedTrackType.TITLE) {
            value = track.title;
          }
          return (
            <Picker.Item
              label={`${value} - ${track.selected}`}
              value={`${value}`}
              key={`${value}`}
            />
          );
        })}
      </Picker>
    </>
  );
};
