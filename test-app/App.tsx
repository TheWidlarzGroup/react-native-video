/**
 * RNVideoE2E — dedicated E2E host app. Scenarios are opened via deep link
 * (rnvtest://scenario/<name>), never via UI navigation. See e2e/CONTEXT.md.
 */
import React from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScenarioScreen } from './src/e2e/ScenarioScreen';
import { parseScenario } from './src/e2e/deepLink';
import { eventLog } from './src/e2e/eventLog';
import { type ScenarioName } from './src/e2e/fixtures';

/**
 * Resolves the scenario from the launch URL and from later `url` events.
 *
 * `ready` flips to true only after the `url` listener is attached. The default screen
 * renders the `e2e-host-ready` marker from that flag, so a flow that waits for the
 * marker before `openLink` is guaranteed the link will be received: RCTLinkingManager's
 * `url` notification is fire-and-forget and is lost if nothing is subscribed yet.
 *
 * Android re-reads: RNTA's singleApp mode opens a deep link by forwarding it into a
 * fresh ComponentActivity (see test-app/patches/). RN's `IntentModule.getInitialURL()`
 * reads `getCurrentActivity().intent`, and `getCurrentActivity()` can still point at
 * the PREVIOUS activity for a brief window after the new one is created. For the first
 * link that yields null; for a second link (scenario A -> scenario B in one session) it
 * yields A's link, so a "retry on null" is not enough. Re-read a couple of times and
 * adopt whatever the new activity reports; a repeated identical value is a no-op. iOS
 * reads the launch URL from `UIApplicationLaunchOptionsURLKey` and has no such race.
 */
let rootCounter = 0;

function useScenarioDeepLink(): {
  scenario: ScenarioName | null;
  ready: boolean;
  rootId: number;
} {
  const [scenario, setScenario] = React.useState<ScenarioName | null>(null);
  const [ready, setReady] = React.useState(false);
  // Each mounted App (one per RNTA activity / React root) gets an id so the event log
  // shows which root a scenario mounted in and how the link reached it.
  const rootId = React.useRef(++rootCounter).current;

  React.useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // Once a link arrives through the event, the activity's original intent (what
    // getInitialURL reads) is stale: stop re-reading it.
    let gotUrlEvent = false;

    const sub = Linking.addEventListener('url', ({ url }) => {
      gotUrlEvent = true;
      if (retryTimer) clearTimeout(retryTimer);
      eventLog.log(`root#${rootId} url-event ${url}`);
      setScenario(parseScenario(url));
    });
    setReady(true);

    const ANDROID_REREAD_DELAYS_MS = [300, 1000];
    const resolveInitialURL = (attempt: number) => {
      Linking.getInitialURL().then((url) => {
        if (cancelled || gotUrlEvent) return;
        const resolved = parseScenario(url);
        eventLog.log(`root#${rootId} initialURL#${attempt} ${url ?? 'null'}`);
        if (resolved) setScenario(resolved);
        const delay = ANDROID_REREAD_DELAYS_MS[attempt];
        if (Platform.OS === 'android' && delay !== undefined) {
          retryTimer = setTimeout(() => resolveInitialURL(attempt + 1), delay);
        }
      });
    };
    resolveInitialURL(0);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      sub.remove();
    };
  }, [rootId]);

  return { scenario, ready, rootId };
}

export default function App(): React.JSX.Element {
  const { scenario, ready, rootId } = useScenarioDeepLink();

  return (
    <SafeAreaView style={styles.app}>
      {scenario ? (
        // Keyed on the scenario so switching scenarios remounts the screen: a fresh
        // player, a fresh setup callback and a fresh event log every time.
        <ScenarioScreen key={scenario} scenario={scenario} rootId={rootId} />
      ) : ready ? (
        // Centred on purpose: React Native's dev banner ("Connect to Metro to develop
        // JavaScript") covers the top of the screen for a few seconds after a debug
        // launch, longer on a slow simulator, and Maestro treats anything under it as
        // invisible. LogBox notifications sit at the bottom. The middle is safe.
        <View style={styles.centered}>
          <Text testID="e2e-host-ready">RNVideoE2E ready</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    // SafeAreaView only insets on iOS. On Android 15+ (API 35+) the app draws
    // edge-to-edge, so without this the first marker sits under the status bar and
    // Maestro drops it from the hierarchy as invisible.
    paddingTop: Platform.select({
      android: StatusBar.currentHeight ?? 24,
      default: 0,
    }),
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
