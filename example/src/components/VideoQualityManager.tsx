import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  useEvent,
  type VideoPlayer,
  type VideoTrack,
} from 'react-native-video';
import { styles } from '../styles';
import { ActionButton } from './Controls';

/**
 * A 5-rendition HLS ladder (1080p down to 240p) - handy for seeing that a pick
 * really holds instead of adapting back up on a fast connection.
 */
const MULTI_QUALITY_HLS =
  'https://customer-vqqc4fy8qdpeh3hl.cloudflarestream.com/b082f752bae094a9bebd493a23b940c6/manifest/video.m3u8';

export const VideoQualityManager = ({ player }: { player: VideoPlayer }) => {
  const [videoTracks, setVideoTracks] = React.useState<VideoTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>();
  const [activeTrackId, setActiveTrackId] = React.useState<string>();
  const [events, setEvents] = React.useState<string[]>([]);

  const loadVideoTracks = React.useCallback(() => {
    try {
      setVideoTracks(player.getAvailableVideoTracks());
      setSelectedTrackId(player.selectedVideoTrackId);
    } catch (error) {
      console.error('Error loading video tracks:', error);
    }
  }, [player]);

  const selectTrack = React.useCallback(
    (trackId?: string) => {
      try {
        player.selectVideoTrack(trackId);
      } catch (error) {
        console.error('Error selecting video track:', error);
      }
    },
    [player]
  );

  useEvent(player, 'onReadyToDisplay', loadVideoTracks);

  useEvent(player, 'onVideoTrackChange', (data) => {
    setVideoTracks(data.availableTracks);
    setSelectedTrackId(data.selectedTrackId);
    setActiveTrackId(data.activeTrackId);

    const timestamp = new Date().toLocaleTimeString();
    const message = `${timestamp}: ${data.availableTracks.length} tracks, selected=${
      data.selectedTrackId ?? 'auto'
    }, active=${data.activeTrackId ?? 'none'}`;
    setEvents((prev) => [message, ...prev.slice(0, 5)]);
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Refresh Qualities" onPress={loadVideoTracks} />
        <ActionButton label="Auto" onPress={() => selectTrack(undefined)} />
        <ActionButton
          label="Load Ladder Source"
          onPress={() => {
            player
              .replaceSourceAsync({ uri: MULTI_QUALITY_HLS })
              .catch(console.error);
          }}
        />
      </View>

      <View style={styles.selectedTrackInfo}>
        <Text style={styles.selectedTrackLabel}>Pinned / Playing:</Text>
        <Text style={styles.selectedTrackText}>
          {selectedTrackId ?? 'Auto'} / {activeTrackId ?? 'none'}
        </Text>
      </View>

      {events.length > 0 && (
        <View style={styles.eventLogContainer}>
          <Text style={styles.eventLogTitle}>Quality Change Events:</Text>
          {events.map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}

      {videoTracks.length > 0 ? (
        <View style={styles.trackList}>
          <Text style={styles.subSectionTitle}>
            Available Qualities ({videoTracks.length})
          </Text>
          {videoTracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackButton,
                selectedTrackId === track.id && styles.trackButtonSelected,
              ]}
              onPress={() => selectTrack(track.id)}
            >
              <Text
                style={[
                  styles.trackButtonText,
                  selectedTrackId === track.id &&
                    styles.trackButtonTextSelected,
                ]}
              >
                {track.label}
                {track.width && track.height
                  ? ` (${track.width}x${track.height})`
                  : ''}
                {track.selected && ' ▶'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.noTracksText}>No video tracks available</Text>
      )}
    </View>
  );
};

export default VideoQualityManager;
