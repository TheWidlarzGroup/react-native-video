import React from 'react';
import { Text, View } from 'react-native';
import { useEvent, type VideoPlayer } from 'react-native-video';
import { styles } from '../styles';
import { AD_TAGS, getVideoSource, type VideoType } from '../utils/videoSource';
import { ActionButton, ToggleButton } from './Controls';

export const AdsManager = ({
  player,
  videoType,
  onEnterFullscreen,
  onExitFullscreen,
}: {
  player: VideoPlayer;
  videoType: VideoType;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
}) => {
  // Nothing is selected until the user picks a format: the app opens without an ad session.
  const [adTagId, setAdTagId] = React.useState<string>();

  // Switching the content type loads a plain source again, which ends the ad session.
  React.useEffect(() => setAdTagId(undefined), [videoType]);
  const [adState, setAdState] = React.useState(player.adState);
  const [isPlayingAd, setIsPlayingAd] = React.useState(player.isPlayingAd);
  const [adEvents, setAdEvents] = React.useState<string[]>([]);

  const logEvent = React.useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAdEvents((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 6)]);
  }, []);

  const activateAds = React.useCallback(() => {
    player.activateAds().catch((error) => {
      console.error('Error activating ads:', error);
    });
  }, [player]);

  const deactivateAds = React.useCallback(() => {
    try {
      player.deactivateAds();
    } catch (error) {
      console.error('Error deactivating ads:', error);
    }
  }, [player]);

  const selectAdTag = React.useCallback(
    async (id: string, url: string) => {
      setAdTagId(id);
      try {
        await player.replaceSourceAsync(getVideoSource(videoType, url));
        await player.activateAds();
        // Ads (like content) only start once playback is requested.
        player.play();
      } catch (error) {
        console.error('Error loading ad tag:', error);
      }
    },
    [player, videoType]
  );

  const skipAd = React.useCallback(() => {
    try {
      player.skipAd();
    } catch (error) {
      console.error('Error skipping ad:', error);
    }
  }, [player]);

  // One listener for every ad event: `type` is the event name, `data` its payload.
  useEvent(player, 'onAdEvent', ({ type, data }) => {
    switch (type) {
      case 'adStateChange':
        setAdState(data);
        setIsPlayingAd(player.isPlayingAd);
        logEvent(`Ad state -> ${data}`);
        break;
      case 'adsResolved':
        logEvent(
          `Ads resolved: hasAds=${data.hasAds} (${data.elapsedMs.toFixed(0)}ms)`
        );
        break;
      case 'adBreakStart':
        logEvent(`Ad break start: ${data.kind}, ${data.totalAds} ad(s)`);
        break;
      case 'adBreakEnd':
        logEvent(`Ad break end: ${data.kind}`);
        break;
      case 'adStart':
        logEvent(
          `Ad start: ${data.title ?? data.adId} (${data.adPodIndex + 1}/${data.totalAdsInPod})`
        );
        break;
      case 'adComplete':
        logEvent(`Ad complete: ${data.title ?? data.adId}`);
        break;
      case 'adSkipped':
        logEvent(`Ad skipped: ${data.title ?? data.adId}`);
        break;
      case 'adClicked':
        logEvent('Ad clicked');
        break;
      case 'adError':
        logEvent(`Ad error${data.fatal ? ' (fatal)' : ''}: ${data.message}`);
        break;
      case 'allAdsCompleted':
        logEvent('All ads completed');
        break;
    }
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Enter Fullscreen" onPress={onEnterFullscreen} />
        <ActionButton label="Exit Fullscreen" onPress={onExitFullscreen} />
        <ActionButton label="Skip Ad" onPress={skipAd} />
      </View>

      <View style={styles.selectedTrackInfo}>
        <Text style={styles.selectedTrackLabel}>Ad State:</Text>
        <Text style={styles.selectedTrackText}>
          {adState}
          {isPlayingAd ? ' (playing)' : ''}
        </Text>
      </View>

      {adEvents.length > 0 && (
        <View style={styles.eventLogContainer}>
          {adEvents.slice(0, 3).map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.buttonGroup}>
        {AD_TAGS.map((tag) => (
          <ToggleButton
            key={tag.id}
            label={tag.label}
            active={adTagId === tag.id}
            onPress={() => selectAdTag(tag.id, tag.url)}
          />
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <ActionButton label="Activate Ads" onPress={activateAds} />
        <ActionButton label="Deactivate Ads" onPress={deactivateAds} />
      </View>
    </View>
  );
};

export default AdsManager;
