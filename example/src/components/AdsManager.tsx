import React from 'react';
import { Text, View } from 'react-native';
import { useEvent, type VideoPlayer } from 'react-native-video';
import { styles } from '../styles';
import { ActionButton } from './Controls';

export const AdsManager = ({ player }: { player: VideoPlayer }) => {
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

  const skipAd = React.useCallback(() => {
    try {
      player.skipAd();
    } catch (error) {
      console.error('Error skipping ad:', error);
    }
  }, [player]);

  useEvent(player, 'onAdStateChange', (state) => {
    setAdState(state);
    setIsPlayingAd(player.isPlayingAd);
    logEvent(`Ad state -> ${state}`);
  });

  useEvent(player, 'onAdsResolved', ({ hasAds, elapsedMs }) => {
    logEvent(`Ads resolved: hasAds=${hasAds} (${elapsedMs.toFixed(0)}ms)`);
  });

  useEvent(player, 'onAdBreakStart', ({ kind, totalAds }) => {
    logEvent(`Ad break start: ${kind}, ${totalAds} ad(s)`);
  });

  useEvent(player, 'onAdBreakEnd', ({ kind }) => {
    logEvent(`Ad break end: ${kind}`);
  });

  useEvent(player, 'onAdStart', (ad) => {
    logEvent(
      `Ad start: ${ad.title ?? ad.adId} (${ad.adPodIndex + 1}/${ad.totalAdsInPod})`
    );
  });

  useEvent(player, 'onAdComplete', (ad) => {
    logEvent(`Ad complete: ${ad.title ?? ad.adId}`);
  });

  useEvent(player, 'onAdSkipped', (ad) => {
    logEvent(`Ad skipped: ${ad.title ?? ad.adId}`);
  });

  useEvent(player, 'onAdClicked', () => {
    logEvent('Ad clicked');
  });

  useEvent(player, 'onAdError', ({ message, fatal }) => {
    logEvent(`Ad error${fatal ? ' (fatal)' : ''}: ${message}`);
  });

  useEvent(player, 'onAllAdsCompleted', () => {
    logEvent('All ads completed');
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Activate Ads" onPress={activateAds} />
        <ActionButton label="Deactivate Ads" onPress={deactivateAds} />
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
          <Text style={styles.eventLogTitle}>Ad Events:</Text>
          {adEvents.map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default AdsManager;
