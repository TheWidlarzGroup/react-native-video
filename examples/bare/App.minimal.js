/**
 * React Native Video Demo for Win32
 * @format
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  NativeModules,
} from 'react-native';

// File picker for Windows
const {FilePicker} = NativeModules;

export default function MinimalApp() {
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleBrowse = useCallback(async () => {
    // For now, simulate file selection with a prompt
    // In a full implementation, this would use a native file picker
    const sampleVideos = [
      {name: 'Sample Video 1.mp4', path: 'C:\\Videos\\sample1.mp4', duration: 180},
      {name: 'Sample Video 2.mp4', path: 'C:\\Videos\\sample2.mp4', duration: 240},
      {name: 'Big Buck Bunny.mp4', path: 'C:\\Videos\\bunny.mp4', duration: 596},
    ];
    // Cycle through sample videos for demo
    const currentIndex = selectedVideo 
      ? sampleVideos.findIndex(v => v.path === selectedVideo.path)
      : -1;
    const nextIndex = (currentIndex + 1) % sampleVideos.length;
    const video = sampleVideos[nextIndex];
    setSelectedVideo(video);
    setDuration(video.duration);
    setCurrentTime(0);
    setIsPlaying(false);
    setPaused(true);
  }, [selectedVideo]);

  const handlePlay = useCallback(() => {
    if (selectedVideo) {
      setIsPlaying(true);
      setPaused(false);
      // Simulate playback progress
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            setPaused(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      // Store interval ID for cleanup
      window.playbackInterval = interval;
    }
  }, [selectedVideo, duration]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setPaused(true);
    if (window.playbackInterval) {
      clearInterval(window.playbackInterval);
    }
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setPaused(true);
    setCurrentTime(0);
    if (window.playbackInterval) {
      clearInterval(window.playbackInterval);
    }
  }, []);

  const handleSeek = useCallback((position) => {
    // position is 0-1 representing percentage
    const newTime = Math.floor(position * duration);
    setCurrentTime(newTime);
  }, [duration]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Video Player</Text>

      {/* Video Display Area */}
      <View style={styles.videoContainer}>
        {selectedVideo ? (
          <View style={styles.videoPlaceholder}>
            {isPlaying ? (
              <Text style={styles.playingText}>▶ Playing...</Text>
            ) : (
              <Text style={styles.videoIcon}>🎬</Text>
            )}
            <Text style={styles.videoName}>{selectedVideo.name}</Text>
          </View>
        ) : (
          <View style={styles.noVideoPlaceholder}>
            <Text style={styles.noVideoIcon}>📁</Text>
            <Text style={styles.noVideoText}>No video selected</Text>
            <Text style={styles.noVideoHint}>Click "Browse" to select a video</Text>
          </View>
        )}
      </View>

      {/* Browse Button - Right below video */}
      <TouchableOpacity style={styles.browseButton} onPress={handleBrowse}>
        <Text style={styles.browseIcon}>📂</Text>
        <Text style={styles.browseText}>Browse This Computer</Text>
      </TouchableOpacity>

      {/* File Info */}
      {selectedVideo && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileInfoLabel}>Selected: </Text>
          <Text style={styles.fileInfoPath}>{selectedVideo.name}</Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <TouchableOpacity 
          style={styles.progressBar}
          onPress={(e) => {
            const {locationX} = e.nativeEvent;
            const width = 300; // approximate width
            handleSeek(locationX / width);
          }}
        >
          <View style={[styles.progressFill, {width: `${progressPercent}%`}]} />
          <View style={[styles.progressThumb, {left: `${progressPercent}%`}]} />
        </TouchableOpacity>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, !selectedVideo && styles.controlButtonDisabled]} 
          onPress={handleStop}
          disabled={!selectedVideo}
        >
          <Text style={styles.controlIcon}>⏹</Text>
          <Text style={styles.controlLabel}>Stop</Text>
        </TouchableOpacity>

        {isPlaying ? (
          <TouchableOpacity 
            style={[styles.playButton, !selectedVideo && styles.controlButtonDisabled]} 
            onPress={handlePause}
            disabled={!selectedVideo}
          >
            <Text style={styles.playIcon}>⏸</Text>
            <Text style={styles.playLabel}>Pause</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.playButton, !selectedVideo && styles.controlButtonDisabled]} 
            onPress={handlePlay}
            disabled={!selectedVideo}
          >
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.playLabel}>Play</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.controlButton, !selectedVideo && styles.controlButtonDisabled]} 
          onPress={handleStop}
          disabled={!selectedVideo}
        >
          <Text style={styles.controlIcon}>⏭</Text>
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    marginTop: 10,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 600,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a15',
    width: '100%',
  },
  playingText: {
    fontSize: 32,
    color: '#0078d7',
    marginBottom: 10,
  },
  videoIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  videoName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  noVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  noVideoIcon: {
    fontSize: 48,
    marginBottom: 10,
    opacity: 0.5,
  },
  noVideoText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  noVideoHint: {
    fontSize: 14,
    color: '#444',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    width: 50,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 10,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0078d7',
    borderRadius: 4,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginLeft: -8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  controlLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#0078d7',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  playIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  playLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0078d7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 5,
  },
  browseIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  browseText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  fileInfo: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#252542',
    borderRadius: 6,
  },
  fileInfoLabel: {
    fontSize: 13,
    color: '#888',
  },
  fileInfoPath: {
    fontSize: 13,
    color: '#0078d7',
    fontWeight: '500',
  },
});
