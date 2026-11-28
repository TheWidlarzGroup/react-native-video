import { test, expect } from 'bun:test';
import { applyAndroidManifest, applyInfoPlist } from './rnv-e2e-plugin.mjs';

// The shape of react-native-test-app's AndroidManifest.xml as xml2js parses it. It is not
// read from node_modules because the plugin rewrites that file in place.
function freshManifest() {
  return {
    manifest: {
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [
            {
              $: { 'android:name': 'com.microsoft.reacttestapp.MainActivity' },
              'intent-filter': [
                {
                  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                  category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
                },
              ],
            },
            {
              $: { 'android:name': 'com.microsoft.reacttestapp.component.ComponentActivity' },
            },
          ],
        },
      ],
    },
  };
}

function rnvFilters(activity) {
  return (activity['intent-filter'] ?? []).filter((f) =>
    (f.data ?? []).some((d) => d.$['android:scheme'] === 'rnvtest')
  );
}

test('android: adds the deep-link filter and cleartext', () => {
  const original = freshManifest();
  const m = applyAndroidManifest(freshManifest());
  const [launcher, componentActivity] = m.manifest.application[0].activity;
  expect(m.manifest.application[0].$['android:usesCleartextTraffic']).toBe('true');

  expect(rnvFilters(launcher)).toEqual([
    {
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [{ $: { 'android:scheme': 'rnvtest' } }],
    },
  ]);
  const [originalLauncher, originalComponentActivity] = original.manifest.application[0].activity;
  expect(launcher['intent-filter'][0]).toEqual(originalLauncher['intent-filter'][0]);
  expect(componentActivity).toEqual(originalComponentActivity);
});

test('android: applying the transform again changes nothing', () => {
  const once = applyAndroidManifest(freshManifest());
  const snapshot = structuredClone(once);
  expect(applyAndroidManifest(once)).toEqual(snapshot);
});

test('android: finds the LAUNCHER activity by category, not by position', () => {
  const m = freshManifest();
  const other = {
    $: { 'android:name': '.SomethingElse' },
    'intent-filter': [{ action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }] }],
  };
  m.manifest.application[0].activity.unshift(other);
  const [first, launcher] = applyAndroidManifest(m).manifest.application[0].activity;
  expect(rnvFilters(first)).toHaveLength(0);
  expect(rnvFilters(launcher)).toHaveLength(1);
});

test('android: fails with a clear error when there is no LAUNCHER activity', () => {
  const m = freshManifest();
  m.manifest.application[0].activity.shift();
  expect(() => applyAndroidManifest(m)).toThrow('no LAUNCHER activity');
});

test('ios: adds the URL scheme, and applying again changes nothing', () => {
  const p = applyInfoPlist({});
  expect(p.CFBundleURLTypes).toEqual([{ CFBundleURLSchemes: ['rnvtest'] }]);
  expect(applyInfoPlist(structuredClone(p))).toEqual(p);
});

test('ios: keeps existing URL types', () => {
  const p = applyInfoPlist({ CFBundleURLTypes: [{ CFBundleURLSchemes: ['other'] }] });
  expect(p.CFBundleURLTypes).toEqual([
    { CFBundleURLSchemes: ['other'] },
    { CFBundleURLSchemes: ['rnvtest'] },
  ]);
});
