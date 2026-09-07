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
import { type ScenarioName } from './src/e2e/fixtures';

function parseScenario(url: string | null): ScenarioName | null {
  if (!url) return null;
  const match = url.match(/^rnvtest:\/\/scenario\/([^/?#]+)/);
  return (match?.[1] as ScenarioName) ?? null;
}

/**
 * RNTA's singleApp mode opens a deep link by forwarding it into a brand new
 * ComponentActivity instance (MainActivity forwards + finishes — see the patch in
 * test-app/patches/). That new activity's fresh JS root calls getInitialURL() essentially
 * immediately, but IntentModule.getInitialURL() (react-native's Android implementation)
 * reads getCurrentActivity().intent — and getCurrentActivity() is updated by RN's own
 * activity-lifecycle tracking, which can still be pointing at the *previous* activity for
 * a brief window after the new one is created (confirmed via `adb shell dumpsys activity
 * activities`: the new activity is topResumedActivity with the correct action/data at the
 * exact moment getInitialURL() reads stale state and returns null). One retry after a
 * short delay is enough in practice. iOS doesn't need this — RCTLinkingManager reads
 * UIApplicationLaunchOptionsURLKey directly, no cross-activity race involved.
 */
function useScenarioDeepLink(): ScenarioName | null {
  const [scenario, setScenario] = React.useState<ScenarioName | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

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

    const sub = Linking.addEventListener('url', ({ url }) =>
      setScenario(parseScenario(url))
    );
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      sub.remove();
    };
  }, []);

  return scenario;
}

export default function App(): React.JSX.Element {
  const scenario = useScenarioDeepLink();

  return (
    <SafeAreaView style={styles.app}>
      {scenario ? (
        <ScenarioScreen scenario={scenario} />
      ) : (
        <Text testID="e2e-host-ready">RNVideoE2E ready</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
});
