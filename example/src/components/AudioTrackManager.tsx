import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  useEvent,
  type AudioTrack,
  type VideoPlayer,
} from 'react-native-video';
import { styles } from '../styles';
import { ActionButton } from './Controls';

/**
 * Apple's own "bipbop advanced" example stream. Its master playlist declares two
 * alternate audio renditions (#EXT-X-MEDIA TYPE=AUDIO, both eng) on top of the
 * subtitle renditions, which makes it the smallest public source that proves a
 * switch really happened - the two mixes sound different. AVFoundation surfaces
 * them as "English" and "BipBop Audio 2 - English".
 */
const MULTI_AUDIO_HLS =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8';

/**
 * Apple's Dolby Vision / Atmos example. Its audible group carries a main and a
 * describes-video rendition ("English (US)" / "English (US) AD"), so it is the
 * one to reach for when checking that a characteristic-tagged alternate is
 * enumerated and selectable like any other.
 */
const MULTI_CHANNEL_HLS =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8';

export const AudioTrackManager = ({ player }: { player: VideoPlayer }) => {
  const [audioTracks, setAudioTracks] = React.useState<AudioTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>();
  const [events, setEvents] = React.useState<string[]>([]);

  const loadAudioTracks = React.useCallback(() => {
    try {
      setAudioTracks(player.getAvailableAudioTracks());
      setSelectedTrackId(player.selectedAudioTrackId);
    } catch (error) {
      console.error('Error loading audio tracks:', error);
    }
  }, [player]);

  const selectTrack = React.useCallback(
    (trackId?: string) => {
      try {
        player.selectAudioTrack(trackId);
        // Read straight back, synchronously: on iOS the selection is exact and
        // immediate, so `selectedAudioTrackId` must already agree.
        console.log(
          '[AudioTrackManager] asked for',
          trackId ?? 'auto',
          '-> selectedAudioTrackId is',
          player.selectedAudioTrackId,
          '| tracks:',
          JSON.stringify(player.getAvailableAudioTracks())
        );
      } catch (error) {
        console.error('Error selecting audio track:', error);
      }
    },
    [player]
  );

  useEvent(player, 'onReadyToDisplay', loadAudioTracks);

  useEvent(player, 'onAudioTrackChange', (data) => {
    setAudioTracks(data.availableTracks);
    setSelectedTrackId(data.selectedTrackId);

    const timestamp = new Date().toLocaleTimeString();
    const message = `${timestamp}: ${data.availableTracks.length} tracks, selected=${
      data.selectedTrackId ?? 'auto'
    }`;
    setEvents((prev) => [message, ...prev.slice(0, 5)]);
    console.log('[AudioTrackManager] onAudioTrackChange', JSON.stringify(data));
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Refresh Audio" onPress={loadAudioTracks} />
        <ActionButton label="Auto" onPress={() => selectTrack(undefined)} />
        <ActionButton
          label="Load 2-Audio Source"
          onPress={() => {
            player
              .replaceSourceAsync({ uri: MULTI_AUDIO_HLS })
              .catch(console.error);
          }}
        />
        <ActionButton
          label="Load Atmos Source"
          onPress={() => {
            player
              .replaceSourceAsync({ uri: MULTI_CHANNEL_HLS })
              .catch(console.error);
          }}
        />
      </View>

      <View style={styles.selectedTrackInfo}>
        <Text style={styles.selectedTrackLabel}>Selected:</Text>
        <Text style={styles.selectedTrackText}>
          {selectedTrackId ?? 'Auto'}
        </Text>
      </View>

      {events.length > 0 && (
        <View style={styles.eventLogContainer}>
          <Text style={styles.eventLogTitle}>Audio Track Change Events:</Text>
          {events.map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}

      {audioTracks.length > 0 ? (
        <View style={styles.trackList}>
          <Text style={styles.subSectionTitle}>
            Available Audio Tracks ({audioTracks.length})
          </Text>
          {audioTracks.map((track) => (
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
                {track.language ? ` [${track.language}]` : ''}
                {track.channels ? ` - ${track.channels}ch` : ''}
                {track.selected && ' ▶'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.noTracksText}>No audio tracks available</Text>
      )}
    </View>
  );
};

export default AudioTrackManager;
