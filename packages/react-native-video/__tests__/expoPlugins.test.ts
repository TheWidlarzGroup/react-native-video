import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ExpoConfig } from '@expo/config-types';
import { withBackgroundAudio } from '../src/expo-plugins/withBackgroundAudio';
import { withAndroidPictureInPicture } from '../src/expo-plugins/withAndroidPictureInPicture';
import { withAndroidExtensions } from '../src/expo-plugins/withAndroidExtensions';
import { withAndroidNotificationControls } from '../src/expo-plugins/withAndroidNotificationControls';
import { writeToPodfile } from '../src/expo-plugins/writeToPodfile';
import withReactNativeVideo from '../src/expo-plugins/withReactNativeVideo';

// Config plugins only register mod functions; prebuild runs them later with the parsed
// native file as `modResults`. This invokes one registered mod the way prebuild does.
async function runMod<T>(
  config: ExpoConfig,
  platform: 'ios' | 'android',
  mod: string,
  modResults: T
): Promise<T> {
  const fn = (config as any).mods?.[platform]?.[mod];
  if (!fn) throw new Error(`no ${platform}.${mod} mod registered`);
  const result = await fn({ ...config, modResults, modRequest: {} });
  return result.modResults;
}

const baseConfig = (): ExpoConfig => ({ name: 'app', slug: 'app', android: { permissions: [] } });

function manifest({ mainActivity = true, service = true } = {}) {
  return {
    manifest: {
      $: {},
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: mainActivity ? [{ $: { 'android:name': '.MainActivity' } }] : [],
          ...(service ? { service: [] as any[] } : {}),
        },
      ],
    },
  } as any;
}

test('withBackgroundAudio adds audio once and removes it when disabled', async () => {
  const on = withBackgroundAudio(baseConfig(), true);
  expect(await runMod(on, 'ios', 'infoPlist', {})).toEqual({ UIBackgroundModes: ['audio'] });
  expect(await runMod(on, 'ios', 'infoPlist', { UIBackgroundModes: ['fetch', 'audio'] })).toEqual({
    UIBackgroundModes: ['fetch', 'audio'],
  });
  const off = withBackgroundAudio(baseConfig(), false);
  expect(await runMod(off, 'ios', 'infoPlist', { UIBackgroundModes: ['fetch', 'audio'] })).toEqual({
    UIBackgroundModes: ['fetch'],
  });
});

test('withAndroidPictureInPicture flags .MainActivity and tolerates its absence', async () => {
  const m = await runMod(withAndroidPictureInPicture(baseConfig(), true), 'android', 'manifest', manifest());
  expect(m.manifest.application[0].activity[0].$['android:supportsPictureInPicture']).toBe('true');

  const untouched = manifest();
  const off = await runMod(withAndroidPictureInPicture(baseConfig(), false), 'android', 'manifest', untouched);
  expect(off.manifest.application[0].activity[0].$['android:supportsPictureInPicture']).toBeUndefined();

  const noActivity = manifest({ mainActivity: false });
  await expect(
    runMod(withAndroidPictureInPicture(baseConfig(), true), 'android', 'manifest', noActivity)
  ).resolves.toBeDefined();
});

test('withAndroidExtensions writes both flags, defaults to true, and replaces stale entries', async () => {
  const props = (v: unknown) => (v as { type: string; key: string; value: string }[]).filter((p) => p.type === 'property');

  const defaults = await runMod(withAndroidExtensions(baseConfig(), undefined), 'android', 'gradleProperties', []);
  expect(props(defaults)).toEqual([
    { type: 'property', key: 'RNVideo_useExoplayerDash', value: 'true' },
    { type: 'property', key: 'RNVideo_useExoplayerHls', value: 'true' },
  ]);

  const stale = [
    { type: 'property', key: 'RNVideo_useExoplayerDash', value: 'true' },
    { type: 'property', key: 'other', value: 'x' },
  ];
  const explicit = await runMod(withAndroidExtensions(baseConfig(), { useExoplayerHls: false }), 'android', 'gradleProperties', stale);
  expect(props(explicit)).toEqual([
    { type: 'property', key: 'other', value: 'x' },
    { type: 'property', key: 'RNVideo_useExoplayerDash', value: 'false' },
    { type: 'property', key: 'RNVideo_useExoplayerHls', value: 'false' },
  ]);

  // Idempotent: running the same mod twice yields the same properties.
  const again = await runMod(withAndroidExtensions(baseConfig(), { useExoplayerHls: false }), 'android', 'gradleProperties', explicit);
  expect(props(again)).toEqual(props(explicit));
});

const SERVICE = 'com.twg.video.core.services.playback.VideoPlaybackService';
const services = (m: any) =>
  (m.manifest.application[0].service ?? []).filter((s: any) => s.$['android:name'] === SERVICE);

test('withAndroidNotificationControls adds the playback service and permissions', async () => {
  const config = withAndroidNotificationControls(baseConfig());
  const m = await runMod(config, 'android', 'manifest', manifest());
  expect(services(m)).toHaveLength(1);
  expect(services(m)[0].$['android:foregroundServiceType']).toBe('mediaPlayback');
  expect(services(m)[0]['intent-filter'][0].action[0].$['android:name']).toBe(
    'androidx.media3.session.MediaSessionService'
  );
  expect(config.android?.permissions).toEqual([
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  ]);
});

test('withAndroidNotificationControls adds the service to a manifest with no <service> yet', async () => {
  // The default Expo template manifest has no <service> element, so xml2js produces
  // no `service` array at all.
  const m = await runMod(withAndroidNotificationControls(baseConfig()), 'android', 'manifest', manifest({ service: false }));
  expect(services(m)).toHaveLength(1);
});

test('withAndroidNotificationControls does not duplicate an existing service', async () => {
  const config = withAndroidNotificationControls(baseConfig());
  const once = await runMod(config, 'android', 'manifest', manifest());
  const twice = await runMod(config, 'android', 'manifest', once);
  expect(services(twice)).toHaveLength(1);
});

test('withReactNativeVideo registers only the mods its props ask for', () => {
  const none = withReactNativeVideo(baseConfig(), {}) as any;
  expect(none.mods.ios?.infoPlist).toBeUndefined();
  expect(none.mods.android?.gradleProperties).toBeUndefined();
  expect(none.mods.android?.manifest).toBeDefined(); // notification controls always

  const all = withReactNativeVideo(baseConfig(), {
    enableBackgroundAudio: true,
    enableAndroidPictureInPicture: true,
    androidExtensions: { useExoplayerDash: false },
  }) as any;
  expect(all.mods.ios.infoPlist).toBeDefined();
  expect(all.mods.android.gradleProperties).toBeDefined();
  expect(all.mods.android.manifest).toBeDefined();
});

function podfileProject(content: string) {
  const root = mkdtempSync(join(tmpdir(), 'rnv-podfile-'));
  mkdirSync(join(root, 'ios'));
  writeFileSync(join(root, 'ios', 'Podfile'), content);
  return { root, read: () => readFileSync(join(root, 'ios', 'Podfile'), 'utf8'), rm: () => rmSync(root, { recursive: true, force: true }) };
}

test('writeToPodfile inserts the variable above `platform :ios` in an Expo Podfile', () => {
  const p = podfileProject("require 'x'\nplatform :ios, '15.1'\ntarget 'App' do\nend\n");
  try {
    writeToPodfile(p.root, 'RNVideoUseVideoCaching', 'true');
    const lines = p.read().split('\n');
    const idx = lines.indexOf('$RNVideoUseVideoCaching = true');
    expect(idx).toBeGreaterThan(-1);
    expect(lines.indexOf("platform :ios, '15.1'")).toBeGreaterThan(idx);
    expect(p.read()).toContain('@generated begin rn-video-set-rnvideousevideocaching');
  } finally {
    p.rm();
  }
});

test('writeToPodfile targets `use_test_app!` in react-native-test-app mode', () => {
  const p = podfileProject("require 'test_app'\n\nuse_test_app!\n");
  try {
    writeToPodfile(p.root, 'RNVideoUseVideoCaching', 'true', true);
    const content = p.read();
    expect(content.indexOf('$RNVideoUseVideoCaching = true')).toBeLessThan(content.indexOf('use_test_app!'));
  } finally {
    p.rm();
  }
});

test('writeToPodfile skips a key that is already defined', () => {
  const defined = podfileProject("$RNVideoUseVideoCaching = false\nplatform :ios, '15.1'\n");
  try {
    writeToPodfile(defined.root, 'RNVideoUseVideoCaching', 'true');
    expect(defined.read()).toBe("$RNVideoUseVideoCaching = false\nplatform :ios, '15.1'\n");
  } finally {
    defined.rm();
  }
});
