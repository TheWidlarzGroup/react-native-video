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
import { parseScenario, type ScenarioName } from './src/e2e/deepLink';

/**
 * Resolves the scenario from the launch URL and from later `url` events.
 *
 * `ready` flips only once the `url` listener is attached. The `e2e-host-ready` marker is
 * rendered from it, so a flow that waits for the marker before `openLink` cannot lose the
 * link: RCTLinkingManager's `url` notification is fire-and-forget.
 */
function useScenarioDeepLink(): {
  scenario: ScenarioName | null;
  ready: boolean;
} {
  const [scenario, setScenario] = React.useState<ScenarioName | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const sub = Linking.addEventListener('url', ({ url }) =>
      setScenario(parseScenario(url))
    );
    setReady(true);

    // Set when the app was launched from a link; a `url` event that came first wins.
    Linking.getInitialURL()
      .then((url) => {
        if (!cancelled) {
          setScenario((current) => current ?? parseScenario(url));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
