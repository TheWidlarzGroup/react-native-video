// @ts-check
// Config plugin for the E2E test app: the rnvtest:// deep-link scheme and Android cleartext
// HTTP to the local fixture server. See e2e/CONTEXT.md ("Test app gotchas").
//
// react-native-test-app applies the Android mods to its own AndroidManifest.xml in
// node_modules and re-runs them on every Gradle build, so each transform must be idempotent.
// They are exported so rnv-e2e-plugin.test.mjs can check that.
import { withAndroidManifest, withInfoPlist } from "@expo/config-plugins";

const URL_SCHEME = "rnvtest";

export function applyInfoPlist(plist) {
  const urlTypes = (plist.CFBundleURLTypes ??= []);
  if (!urlTypes.some((t) => t.CFBundleURLSchemes?.includes(URL_SCHEME))) {
    urlTypes.push({ CFBundleURLSchemes: [URL_SCHEME] });
  }
  return plist;
}

export function applyAndroidManifest(manifest) {
  const app = manifest.manifest.application[0];
  app.$["android:usesCleartextTraffic"] = "true";

  // The OS routes rnvtest:// to the LAUNCHER activity; in singleApp mode it forwards the
  // link to ComponentActivity (see test-app/patches/).
  const launcher = (app.activity ?? []).find((a) =>
    (a["intent-filter"] ?? []).some((f) =>
      (f.category ?? []).some(
        (c) => c.$["android:name"] === "android.intent.category.LAUNCHER"
      )
    )
  );
  if (!launcher) {
    throw new Error(
      "rnv-e2e-plugin: react-native-test-app's AndroidManifest.xml has no LAUNCHER activity"
    );
  }

  const filters = (launcher["intent-filter"] ??= []);
  const hasUrlScheme = filters.some((f) =>
    (f.data ?? []).some((d) => d.$["android:scheme"] === URL_SCHEME)
  );
  if (!hasUrlScheme) {
    filters.push({
      action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
      category: [
        { $: { "android:name": "android.intent.category.DEFAULT" } },
        { $: { "android:name": "android.intent.category.BROWSABLE" } },
      ],
      data: [{ $: { "android:scheme": URL_SCHEME } }],
    });
  }

  return manifest;
}

export default function withRnvE2e(config) {
  config = withInfoPlist(config, (config) => {
    applyInfoPlist(config.modResults);
    return config;
  });
  return withAndroidManifest(config, (config) => {
    applyAndroidManifest(config.modResults);
    return config;
  });
}
