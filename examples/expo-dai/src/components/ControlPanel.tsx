import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {VideoSettings} from './VideoSettings';
import {EventLogger} from './EventLogger';

interface ControlPanelProps {
  isPictureInPicture: boolean;
  isFullscreen: boolean;
  paused: boolean;
  isStreaming: boolean;
  eventBufferLength: number;
  showDebug: boolean;
  contentType: 'vod' | 'live';
  vodContentSourceId: string;
  vodVideoId: string;
  liveAssetKey: string;
  backupStreamUri: string;
  events: Array<{
    id: string;
    timestamp: number;
    type: string;
    data: unknown;
    readableTime: string;
  }>;
  onTogglePictureInPicture: () => void;
  onToggleFullscreen: () => void;
  onTogglePlayPause: () => void;
  onToggleStreaming: () => void;
  onToggleDebug: () => void;
  onContentTypeChange: (type: 'vod' | 'live') => void;
  onVodContentSourceIdChange: (value: string) => void;
  onVodVideoIdChange: (value: string) => void;
  onLiveAssetKeyChange: (value: string) => void;
  onBackupStreamUriChange: (value: string) => void;
  onApplySource: () => void;
}

export function ControlPanel({
  isPictureInPicture,
  isFullscreen,
  paused,
  isStreaming,
  eventBufferLength,
  showDebug,
  contentType,
  vodContentSourceId,
  vodVideoId,
  liveAssetKey,
  backupStreamUri,
  events,
  onTogglePictureInPicture,
  onToggleFullscreen,
  onTogglePlayPause,
  onToggleStreaming,
  onToggleDebug,
  onContentTypeChange,
  onVodContentSourceIdChange,
  onVodVideoIdChange,
  onLiveAssetKeyChange,
  onBackupStreamUriChange,
  onApplySource,
}: ControlPanelProps) {
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}>
      {/* Play/Pause Button */}
      <TouchableOpacity style={styles.button} onPress={onTogglePlayPause}>
        <Text style={styles.buttonText}>{paused ? '▶️ Play' : '⏸️ Pause'}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Source Settings */}
      <VideoSettings
        contentType={contentType}
        vodContentSourceId={vodContentSourceId}
        vodVideoId={vodVideoId}
        liveAssetKey={liveAssetKey}
        backupStreamUri={backupStreamUri}
        onContentTypeChange={onContentTypeChange}
        onVodContentSourceIdChange={onVodContentSourceIdChange}
        onVodVideoIdChange={onVodVideoIdChange}
        onLiveAssetKeyChange={onLiveAssetKeyChange}
        onBackupStreamUriChange={onBackupStreamUriChange}
        onApplySource={onApplySource}
      />

      <View style={styles.divider} />

      {/* Picture in Picture / Fullscreen */}
      <View style={styles.mediaControlsRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonHalf]}
          onPress={onTogglePictureInPicture}>
          <Text style={styles.buttonText}>
            {isPictureInPicture ? '🖼️ Exit' : '🖼️ Enter'} PiP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonHalf]}
          onPress={onToggleFullscreen}>
          <Text style={styles.buttonText}>
            {isFullscreen ? '📺 Exit' : '📺 Enter'} Fullscreen
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Event Section */}
      <TouchableOpacity style={styles.button} onPress={onToggleStreaming}>
        <Text style={styles.buttonText}>
          {isStreaming ? '⏹️ Stop' : '▶️ Start'} Event Streaming
          {eventBufferLength > 0 &&
            !isStreaming &&
            ` (${eventBufferLength} buffered)`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onToggleDebug}>
        <Text style={styles.buttonText}>
          {showDebug ? 'Hide' : 'Show'} Debug View
        </Text>
      </TouchableOpacity>

      <View style={styles.eventsContainer}>
        <EventLogger events={events} isVisible={showDebug} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  button: {
    backgroundColor: '#333',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  mediaControlsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#555',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  eventsContainer: {
    marginHorizontal: 16,
  },
});
