/**
 * RNVideoE2E — dedicated E2E host app. Scenarios are opened via deep link
 * (rnvtest://scenario/<name>), never via UI navigation. See e2e/CONTEXT.md.
 */
import React from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';
import { ScenarioScreen } from './src/e2e/ScenarioScreen';
import { parseScenario } from './src/e2e/deepLink';
import { type ScenarioName } from './src/e2e/fixtures';

/**
 * Resolves the scenario from the launch URL and from later `url` events.
 *
 * `ready` flips to true only after the `url` listener is attached. The default screen
 * renders the `e2e-host-ready` marker from that flag, so a flow that waits for the
 * marker before `openLink` is guaranteed the link will be received: RCTLinkingManager's
 * `url` notification is fire-and-forget and is lost if nothing is subscribed yet.
 *
 * Android retry: RNTA's singleApp mode opens a deep link by forwarding it into a fresh
 * ComponentActivity (see test-app/patches/). RN's `IntentModule.getInitialURL()` reads
 * `getCurrentActivity().intent`, and `getCurrentActivity()` can still point at the
 * previous activity for a brief window after the new one is created, returning null.
 * One retry after a short delay is enough. iOS reads the launch URL from
 * `UIApplicationLaunchOptionsURLKey` directly and has no such race.
 */
function useScenarioDeepLink(): {
  scenario: ScenarioName | null;
  ready: boolean;
} {
  const [scenario, setScenario] = React.useState<ScenarioName | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const sub = Linking.addEventListener('url', ({ url }) =>
      setScenario(parseScenario(url))
    );
    setReady(true);

    const resolveInitialURL = (isRetry: boolean) => {
      Linking.getInitialURL().then((url) => {
        if (cancelled) return;
        const resolved = parseScenario(url);
        if (resolved) {
          setScenario(resolved);
        } else if (!isRetry && Platform.OS === 'android') {
          retryTimer = setTimeout(() => resolveInitialURL(true), 300);
        }
      });
    };
    resolveInitialURL(false);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      sub.remove();
    };
  }, []);

  return { scenario, ready };
}

export default function App(): React.JSX.Element {
  const { scenario, ready } = useScenarioDeepLink();

  return (
    <SafeAreaView style={styles.app}>
      {scenario ? (
        // Keyed on the scenario so switching scenarios remounts the screen: a fresh
        // player, a fresh setup callback and a fresh event log every time.
        <ScenarioScreen key={scenario} scenario={scenario} />
      ) : ready ? (
        <Text testID="e2e-host-ready">RNVideoE2E ready</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
});
