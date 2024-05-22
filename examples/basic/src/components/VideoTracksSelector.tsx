import {Picker} from '@react-native-picker/picker';
import {Text} from 'react-native';
import {
  SelectedVideoTrack,
  SelectedVideoTrackType,
  VideoTrack,
} from 'react-native-video';
import styles from '../styles';
import React from 'react';

export interface VideoTrackSelectorType {
  videoTracks: Array<VideoTrack>;
  selectedVideoTrack: SelectedVideoTrack | undefined;
  onValueChange: (arg0: string) => void;
}

const VideoTrackSelector = ({
  videoTracks,
  selectedVideoTrack,
  onValueChange,
}: VideoTrackSelectorType) => {
  return (
    <>
      <Text style={styles.controlOption}>VideoTrack</Text>
      <Picker
        style={styles.picker}
        itemStyle={styles.pickerItem}
        selectedValue={
          selectedVideoTrack === undefined ||
          selectedVideoTrack?.type === SelectedVideoTrackType.AUTO
            ? 'auto'
            : `${selectedVideoTrack?.value}`
        }
        onValueChange={itemValue => {
          if (itemValue !== 'empty') {
            onValueChange(itemValue);
          }
        }}>
        <Picker.Item label={'auto'} value={'auto'} key={'auto'} />
        {videoTracks?.length <= 0 || videoTracks?.length <= 0 ? (
          <Picker.Item label={'empty'} value={'empty'} key={'empty'} />
        ) : (
          <Picker.Item label={'none'} value={'none'} key={'none'} />
        )}
        {videoTracks?.map(track => {
          if (!track) {
            return;
          }
          return (
            <Picker.Item
              label={`${track.width}x${track.height} ${Math.floor(
                (track.bitrate || 0) / 8 / 1024,
              )} Kbps`}
              value={`${track.index}`}
              key={track.index}
            />
          );
        })}
      </Picker>
    </>
  );
};

export default VideoTrackSelector;
