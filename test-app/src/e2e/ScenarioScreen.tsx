import React, { useRef } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
// v7 API only — never <Video>, never v6 props (see e2e/CONTEXT.md)
import { useVideoPlayer, VideoView } from 'react-native-video';
import { eventLog, RATE_STEPS } from './eventLog';
import { EventLogPanel } from './EventLogPanel';
import { SCENARIO_SOURCES, type ScenarioName } from './fixtures';

/**
 * One screen per scenario, opened via deep link: rnvtest://scenario/<name>. App.tsx keys
 * this component on the scenario, so every scenario gets a fresh mount and a fresh
 * player. The event log is reset inside the player setup callback, before any listener
 * is attached: useVideoPlayer runs that callback synchronously during the first render
 * when initializeOnCreation is false, so a reset in an effect would run AFTER the first
 * events (a 404 fails ~30 ms after mount) and wipe them.
 *
 * Sources set initializeOnCreation: false (see fixtures.ts) and this screen calls
 * player.initialize() itself, after attaching listeners, instead of relying on
 * useVideoPlayer's default auto-load:
 *  - With the default (true), useVideoPlayer defers its setup callback until the native
 *    side's own auto-triggered load reaches onLoadStart/onStatusChange. A source that
 *    fails immediately (error-404, broken-manifest) never reaches that point, so setup()
 *    — and every listener we'd register inside it — never runs at all.
 *  - onError specifically is also JS-only and un-buffered (VideoPlayerEvents.native.ts),
 *    so it must be attached with player.addEventListener before the load that can reject
 *    it is kicked off — matching the pattern in docs/docs/player/events.md — rather than
 *    via useEvent, whose post-render effect can lose a fast local failure.
 *  - onError itself only fires from a JS-side promise rejection (initialize/preload/
 *    replaceSourceAsync, or a synchronous method throw). A source that resolves initialize()
 *    optimistically and only fails later, once AVPlayerItem's async status observation
 *    notices (e.g. a 404: HydridVideoPlayer.swift sets `status = .error` from an observer,
 *    not from a rejected promise) never triggers it — that failure surfaces only via
 *    onStatusChange('error'), so both are needed to catch every error path.
 */
export function ScenarioScreen({ scenario }: { scenario: ScenarioName }) {
  // See RATE_STEPS in eventLog.ts for why the next rate is tracked here, not read
  // from the player at press time.
  const rateStepRef = useRef(0);

  const player = useVideoPlayer(SCENARIO_SOURCES[scenario], (p) => {
    eventLog.reset();
    eventLog.log(`scenario:${scenario}`);

    // Marker derivation lives in eventLog.handle(); this only maps payloads.
    p.addEventListener('onLoad', (e) =>
      eventLog.handle({ type: 'onLoad', duration: e?.duration })
    );
    p.addEventListener('onProgress', (e) =>
      eventLog.handle({ type: 'onProgress', currentTime: e?.currentTime ?? 0 })
    );
    p.addEventListener('onEnd', () => eventLog.handle({ type: 'onEnd' }));
    p.addEventListener('onError', (error) =>
      eventLog.handle({ type: 'onError', code: error.code })
    );
    p.addEventListener('onStatusChange', (status) =>
      eventLog.handle({ type: 'onStatusChange', status })
    );
    p.addEventListener('onPlaybackStateChange', (e) =>
      eventLog.handle({
        type: 'onPlaybackStateChange',
        isPlaying: Boolean(e?.isPlaying),
      })
    );
    p.addEventListener('onSeek', (seekTime) =>
      eventLog.handle({ type: 'onSeek', seekTime })
    );
    p.addEventListener('onVolumeChange', (e) =>
      eventLog.handle({
        type: 'onVolumeChange',
        muted: Boolean(e?.muted),
        volume: e?.volume ?? 1,
      })
    );
    p.addEventListener('onPlaybackRateChange', (rate) =>
      eventLog.handle({ type: 'onPlaybackRateChange', rate })
    );

    p.initialize()
      .then(() => p.play())
      .catch(() => {
        // Rejection is already surfaced via the onError listener above.
      });
  });

  return (
    <View style={styles.screen} testID={`scenario-${scenario}`}>
      <Text testID="scenario-title">scenario:{scenario}</Text>
      <VideoView player={player} style={styles.video} resizeMode="contain" />
      <View style={styles.controls}>
        <Button
          testID="btn-rate-cycle"
          title="rate"
          onPress={() => {
            player.rate = RATE_STEPS[rateStepRef.current];
            rateStepRef.current = (rateStepRef.current + 1) % RATE_STEPS.length;
          }}
        />
        <Button
          testID="btn-play-pause"
          title="play/pause"
          onPress={() => (player.isPlaying ? player.pause() : player.play())}
        />
        <Button
          testID="btn-seek-5"
          title="seek 5s"
          onPress={() => player.seekTo(5)}
        />
        <Button
          testID="btn-seek-1"
          title="seek 1s"
          onPress={() => player.seekTo(1)}
        />
        <Button
          testID="btn-mute-toggle"
          title="mute"
          onPress={() => {
            player.muted = !player.muted;
          }}
        />
        <Button
          testID="btn-volume-low"
          title="vol .3"
          onPress={() => {
            player.muted = false;
            player.volume = 0.3;
          }}
        />
        <Button
          testID="btn-loop-toggle"
          title="loop"
          onPress={() => {
            player.loop = !player.loop;
          }}
        />
      </View>
      {/* Text-surface of player state — everything Maestro asserts on lives here */}
      <EventLogPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  video: { width: '100%', aspectRatio: 16 / 9 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
