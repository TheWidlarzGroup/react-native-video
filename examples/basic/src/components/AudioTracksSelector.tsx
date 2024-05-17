import {Picker} from '@react-native-picker/picker';
import {Text} from 'react-native';
import {AudioTrack, SelectedTrack} from 'react-native-video';
import styles from '../styles';
import React from 'react';

export interface AudioTrackSelectorType {
  audioTracks: Array<AudioTrack>;
  selectedAudioTrack: SelectedTrack | undefined;
  onValueChange: (arg0: string) => void;
}

const AudioTrackSelector = ({
  audioTracks,
  selectedAudioTrack,
  onValueChange,
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
            onValueChange(`${itemValue}`);
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
          return (
            <Picker.Item
              label={`${track.language} - ${track.title} - ${track.selected}`}
              value={`${track.index}`}
              key={`${track.index}`}
            />
          );
        })}
      </Picker>
    </>
  );
};

export default AudioTrackSelector;
