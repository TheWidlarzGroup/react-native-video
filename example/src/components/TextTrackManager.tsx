import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useEvent, type TextTrack, type VideoPlayer } from 'react-native-video';
import { styles } from '../styles';
import { ActionButton } from './Controls';

export const TextTrackManager = ({ player }: { player: VideoPlayer }) => {
  const [textTracks, setTextTracks] = React.useState<TextTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(
    null
  );
  const [currentSelectedTrack, setCurrentSelectedTrack] =
    React.useState<TextTrack | null>(null);
  const [trackChangeEvents, setTrackChangeEvents] = React.useState<string[]>(
    []
  );

  const loadTextTracks = React.useCallback(() => {
    try {
      const tracks = player.getAvailableTextTracks();
      setTextTracks(tracks);

      const selectedTrack = player.selectedTrack;
      setSelectedTrackId(selectedTrack?.id || null);
      setCurrentSelectedTrack(selectedTrack || null);
    } catch (error) {
      console.error('Error loading text tracks:', error);
    }
  }, [player]);

  const selectTrack = React.useCallback(
    (track: TextTrack) => {
      try {
        player.selectTextTrack(track);
      } catch (error) {
        console.error('Error selecting text track:', error);
      }
    },
    [player]
  );

  const disableTextTracks = React.useCallback(() => {
    try {
      player.selectTextTrack(null);
    } catch (error) {
      console.error('Error disabling text tracks:', error);
    }
  }, [player]);

  useEvent(player, 'onReadyToDisplay', () => {
    loadTextTracks();
  });

  useEvent(player, 'onTrackChange', (track) => {
    setCurrentSelectedTrack(track);
    setSelectedTrackId(track?.id || null);

    const timestamp = new Date().toLocaleTimeString();
    const eventMessage = track
      ? `${timestamp}: Track changed to "${track.label}" (${track.id})${track.id.startsWith('external-') ? ' [External]' : ''}`
      : `${timestamp}: All tracks disabled`;

    setTrackChangeEvents((prev) => [eventMessage, ...prev.slice(0, 4)]);
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Refresh Tracks" onPress={loadTextTracks} />
        <ActionButton label="Disable Tracks" onPress={disableTextTracks} />
        <ActionButton
          label="Sync Selection"
          onPress={() => {
            try {
              const selectedTrack = player.selectedTrack;
              setCurrentSelectedTrack(selectedTrack || null);
              setSelectedTrackId(selectedTrack?.id || null);
            } catch (error) {
              console.error('Error syncing selection:', error);
            }
          }}
        />
      </View>

      {currentSelectedTrack && (
        <View style={styles.selectedTrackInfo}>
          <Text style={styles.selectedTrackLabel}>Currently Selected:</Text>
          <Text style={styles.selectedTrackText}>
            {currentSelectedTrack.label}
            {currentSelectedTrack.language &&
              ` (${currentSelectedTrack.language})`}
            {currentSelectedTrack.id.startsWith('external-') && ' [External]'}
          </Text>
        </View>
      )}

      {trackChangeEvents.length > 0 && (
        <View style={styles.eventLogContainer}>
          <Text style={styles.eventLogTitle}>Track Change Events:</Text>
          {trackChangeEvents.map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}

      {textTracks.length > 0 ? (
        <View style={styles.trackList}>
          <Text style={styles.subSectionTitle}>
            Available Tracks ({textTracks.length})
          </Text>
          {textTracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackButton,
                selectedTrackId === track.id && styles.trackButtonSelected,
              ]}
              onPress={() => selectTrack(track)}
            >
              <Text
                style={[
                  styles.trackButtonText,
                  selectedTrackId === track.id &&
                    styles.trackButtonTextSelected,
                ]}
              >
                {track.label} {track.language && `(${track.language})`}
                {track.selected && ' ✓'}
                {track.id.startsWith('external-') && ' [External]'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.noTracksText}>No text tracks available</Text>
          <Text style={styles.noTracksSubText}>
            Make sure the video is loaded. External subtitles are loaded but not
            automatically enabled - you need to select them manually.
          </Text>
        </View>
      )}
    </View>
  );
};

export default TextTrackManager;
