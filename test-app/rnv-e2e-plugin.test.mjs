// react-native-test-app applies the Android config-plugin step to node_modules'
// AndroidManifest.xml IN PLACE and re-runs it on every Gradle build, so every mod must
// be idempotent or the manifest accumulates duplicate intent-filters build after build.
import { test, expect } from 'bun:test';
import { applyAndroidManifest, applyInfoPlist } from './rnv-e2e-plugin.mjs';

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

function launcher(manifest) {
  return manifest.manifest.application[0].activity[0];
}

function rnvFilters(manifest) {
  return launcher(manifest)['intent-filter'].filter((f) =>
    (f.data ?? []).some((d) => d.$['android:scheme'] === 'rnvtest')
  );
}

test('android: adds the deep-link filter, cleartext and PiP once', () => {
  const m = applyAndroidManifest(freshManifest());
  const app = m.manifest.application[0];
  expect(app.$['android:usesCleartextTraffic']).toBe('true');
  expect(app.$['android:supportsPictureInPicture']).toBe('true');
  expect(launcher(m).$['android:supportsPictureInPicture']).toBe('true');
  expect(app.activity[1].$['android:supportsPictureInPicture']).toBe('true');

  const filters = rnvFilters(m);
  expect(filters).toHaveLength(1);
  expect(filters[0].action[0].$['android:name']).toBe('android.intent.action.VIEW');
  expect(filters[0].category.map((c) => c.$['android:name'])).toEqual([
    'android.intent.category.DEFAULT',
    'android.intent.category.BROWSABLE',
  ]);
  // The LAUNCHER filter is untouched.
  expect(launcher(m)['intent-filter']).toHaveLength(2);
});

test('android: applying the transform repeatedly changes nothing', () => {
  const once = applyAndroidManifest(freshManifest());
  const snapshot = JSON.stringify(once);
  for (let i = 0; i < 5; i++) applyAndroidManifest(once);
  expect(JSON.stringify(once)).toBe(snapshot);
  expect(rnvFilters(once)).toHaveLength(1);
});

test('android: the deep link lands on the LAUNCHER activity, not the first activity', () => {
  const m = freshManifest();
  // Put a non-launcher activity first to make sure the lookup is by category.
  m.manifest.application[0].activity.unshift({
    $: { 'android:name': '.SomethingElse' },
    'intent-filter': [{ action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }] }],
  });
  applyAndroidManifest(m);
  const activities = m.manifest.application[0].activity;
  expect(rnvFilters({ manifest: { application: [{ activity: [activities[1]] }] } })).toHaveLength(1);
  expect((activities[0]['intent-filter'] ?? []).some((f) => f.data)).toBe(false);
});

test('android: tolerates a manifest without ComponentActivity', () => {
  const m = freshManifest();
  m.manifest.application[0].activity.pop();
  expect(() => applyAndroidManifest(m)).not.toThrow();
  expect(rnvFilters(m)).toHaveLength(1);
});

test('ios: adds the URL scheme and background audio once', () => {
  const p = applyInfoPlist({});
  expect(p.CFBundleURLTypes).toEqual([{ CFBundleURLSchemes: ['rnvtest'] }]);
  expect(p.UIBackgroundModes).toEqual(['audio']);
});

test('ios: applying the transform repeatedly changes nothing', () => {
  const p = applyInfoPlist({});
  const snapshot = JSON.stringify(p);
  for (let i = 0; i < 5; i++) applyInfoPlist(p);
  expect(JSON.stringify(p)).toBe(snapshot);
});

test('ios: keeps existing URL types and background modes', () => {
  const p = applyInfoPlist({
    CFBundleURLTypes: [{ CFBundleURLSchemes: ['other'] }],
    UIBackgroundModes: ['fetch'],
  });
  expect(p.CFBundleURLTypes).toEqual([
    { CFBundleURLSchemes: ['other'] },
    { CFBundleURLSchemes: ['rnvtest'] },
  ]);
  expect(p.UIBackgroundModes).toEqual(['fetch', 'audio']);
});
