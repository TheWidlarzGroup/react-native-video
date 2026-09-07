import React, { useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
// v7 API only — never <Video>, never v6 props (see e2e/CONTEXT.md)
import { useVideoPlayer, VideoView } from 'react-native-video';
import { eventLog } from './eventLog';
import { EventLogPanel } from './EventLogPanel';
import { SCENARIO_SOURCES, type ScenarioName } from './fixtures';

/**
 * One screen per scenario, opened via deep link: rnvtest://scenario/<name>
 * eventLog.reset() runs on mount so each flow starts from a clean marker state.
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
  useEffect(() => {
    eventLog.reset();
    eventLog.log(`scenario:${scenario}`);
  }, [scenario]);

  // btn-rate-cycle target index: NOT derived from reading player.rate at press time.
  // A tap issued while the video is actively playing is only actually delivered once the
  // player goes idle (see e2e/flows/smoke-rate.yaml) — by then the native `rate` reads 0
  // (stopped), so a "next = f(current rate)" ternary always lands on the wrong step.
  const rateStepRef = useRef(0);
  const RATE_STEPS = [2, 0.5, 1] as const;

  const player = useVideoPlayer(SCENARIO_SOURCES[scenario], (p) => {
    // Counts onEnd firings for this player instance — a marker is a one-shot boolean,
    // so proving `loop` actually restarted playback needs a real counter, not a marker.
    let endCount = 0;
    // Guards evt-seek-back-landed: only meaningful once a forward seek has actually landed.
    let seekedForwardPastFour = false;

    p.addEventListener('onLoad', (e) => {
      eventLog.mark('evt-onLoad');
      eventLog.log(`onLoad duration=${e?.duration ?? '?'}`);
    });

    p.addEventListener('onProgress', (e) => {
      eventLog.mark('evt-onProgress');
      const t = e?.currentTime ?? 0;
      if (t > 2) eventLog.mark('evt-progress-gt-2s'); // derived marker: assert text, not numbers
      if (t > 4) {
        eventLog.mark('evt-seek-fwd-landed');
        seekedForwardPastFour = true;
      }
      if (t < 2 && seekedForwardPastFour) {
        eventLog.mark('evt-seek-back-landed');
      }
    });

    p.addEventListener('onEnd', () => {
      eventLog.mark('evt-onEnded');
      endCount += 1;
      // 3rd end proves an *unassisted* loop restart: e2e/flows/smoke-loop.yaml taps
      // play once to get from end #1 to end #2 (loop wasn't set in time for #1), then
      // makes no further taps — only `loop` itself can produce a #3.
      if (endCount >= 3) eventLog.mark('evt-loop-verified');
      eventLog.log(`onEnded (#${endCount})`);
    });

    p.addEventListener('onError', (error) => {
      eventLog.mark('evt-onError');
      eventLog.setErrorCode(error.code);
      eventLog.log(`onError code=${error.code}`);
    });

    p.addEventListener('onStatusChange', (status) => {
      eventLog.log(`status:${status}`);
      if (status === 'error') {
        eventLog.mark('evt-onError');
        eventLog.setErrorCode('status/error');
      }
    });

    p.addEventListener('onPlaybackStateChange', (e) => {
      eventLog.mark('evt-onPlaybackStateChanged');
      // isPlaying starts false before the first play() too, so "paused" only means
      // something once we've actually seen it playing — same for "resumed" vs. evt-paused.
      if (e?.isPlaying) {
        eventLog.mark('evt-playing');
        if (eventLog.getMarkers().has('evt-paused'))
          eventLog.mark('evt-resumed');
      } else if (eventLog.getMarkers().has('evt-playing')) {
        eventLog.mark('evt-paused');
      }
      eventLog.log(`playbackState ${JSON.stringify(e)}`);
    });

    p.addEventListener('onSeek', (seekTime) => {
      eventLog.mark('evt-onSeek');
      eventLog.log(`onSeek ${seekTime}`);
    });

    p.addEventListener('onVolumeChange', (e) => {
      if (e?.muted) {
        eventLog.mark('evt-muted');
      } else if (eventLog.getMarkers().has('evt-muted')) {
        eventLog.mark('evt-unmuted');
      }
      if (!e?.muted && (e?.volume ?? 1) <= 0.35) {
        eventLog.mark('evt-volume-low');
      }
      eventLog.log(`onVolumeChange ${JSON.stringify(e)}`);
    });

    p.addEventListener('onPlaybackRateChange', (rate) => {
      if (rate === 2) eventLog.mark('evt-rate-2x');
      if (rate === 0.5) eventLog.mark('evt-rate-0-5x');
      eventLog.log(`onPlaybackRateChange ${rate}`);
    });

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
