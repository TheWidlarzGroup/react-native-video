import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

interface VideoSettingsProps {
  contentType: 'vod' | 'live';
  format: 'hls' | 'dash';
  vodContentSourceId: string;
  vodVideoId: string;
  liveAssetKey: string;
  backupStreamUri: string;
  onContentTypeChange: (type: 'vod' | 'live') => void;
  onFormatChange: (format: 'hls' | 'dash') => void;
  onVodContentSourceIdChange: (value: string) => void;
  onVodVideoIdChange: (value: string) => void;
  onLiveAssetKeyChange: (value: string) => void;
  onBackupStreamUriChange: (value: string) => void;
  onApplySource: () => void;
}

export function VideoSettings({
  contentType,
  format,
  vodContentSourceId,
  vodVideoId,
  liveAssetKey,
  backupStreamUri,
  onContentTypeChange,
  onFormatChange,
  onVodContentSourceIdChange,
  onVodVideoIdChange,
  onLiveAssetKeyChange,
  onBackupStreamUriChange,
  onApplySource,
}: VideoSettingsProps) {
  return (
    <>
      {/* Content Type Toggle - Tab Style */}
      <View style={styles.contentTypeContainer}>
        <TouchableOpacity
          style={[
            styles.contentTypeTab,
            styles.contentTypeTabLeft,
            contentType === 'vod' && styles.contentTypeTabActive,
          ]}
          onPress={() => onContentTypeChange('vod')}>
          <Text
            style={[
              styles.contentTypeTabText,
              contentType === 'vod' && styles.contentTypeTabTextActive,
            ]}>
            🎬 VOD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.contentTypeTab,
            styles.contentTypeTabRight,
            contentType === 'live' && styles.contentTypeTabActive,
          ]}
          onPress={() => onContentTypeChange('live')}>
          <Text
            style={[
              styles.contentTypeTabText,
              contentType === 'live' && styles.contentTypeTabTextActive,
            ]}>
            📺 Live
          </Text>
        </TouchableOpacity>
      </View>

      {/* Format Toggle - HLS/DASH (Android only) */}
      <View style={styles.contentTypeContainer}>
        <TouchableOpacity
          style={[
            styles.contentTypeTab,
            styles.contentTypeTabLeft,
            format === 'hls' && styles.contentTypeTabActive,
          ]}
          onPress={() => onFormatChange('hls')}>
          <Text
            style={[
              styles.contentTypeTabText,
              format === 'hls' && styles.contentTypeTabTextActive,
            ]}>
            HLS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.contentTypeTab,
            styles.contentTypeTabRight,
            format === 'dash' && styles.contentTypeTabActive,
          ]}
          onPress={() => onFormatChange('dash')}>
          <Text
            style={[
              styles.contentTypeTabText,
              format === 'dash' && styles.contentTypeTabTextActive,
            ]}>
            DASH
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Input Fields */}
      <View style={styles.inputContainer}>
        {contentType === 'vod' ? (
          <>
            <Text style={styles.inputLabel}>Content Source ID:</Text>
            <TextInput
              style={styles.textInput}
              value={vodContentSourceId}
              onChangeText={onVodContentSourceIdChange}
              placeholder="Enter content source ID"
              placeholderTextColor="#888"
            />
            <Text style={styles.inputLabel}>Video ID:</Text>
            <TextInput
              style={styles.textInput}
              value={vodVideoId}
              onChangeText={onVodVideoIdChange}
              placeholder="Enter video ID"
              placeholderTextColor="#888"
            />
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Asset Key:</Text>
            <TextInput
              style={styles.textInput}
              value={liveAssetKey}
              onChangeText={onLiveAssetKeyChange}
              placeholder="Enter asset key"
              placeholderTextColor="#888"
            />
          </>
        )}
        <Text style={styles.inputLabel}>Backup Stream URI (optional):</Text>
        <TextInput
          style={styles.textInput}
          value={backupStreamUri}
          onChangeText={onBackupStreamUriChange}
          placeholder="Enter backup stream URI"
          placeholderTextColor="#888"
        />
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={styles.button} onPress={onApplySource}>
        <Text style={styles.buttonText}>🔄 Apply Source</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  contentTypeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    overflow: 'hidden',
  },
  contentTypeTab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#333',
    borderRightWidth: 1,
    borderRightColor: '#555',
  },
  contentTypeTabLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  contentTypeTabRight: {
    borderRightWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  contentTypeTabActive: {
    backgroundColor: '#444',
  },
  contentTypeTabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  contentTypeTabTextActive: {
    color: 'white',
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#333',
    color: 'white',
    padding: 6,
    borderRadius: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
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
});
