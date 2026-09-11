// @ts-check
// Config plugin for the RNTA-hosted E2E test app: deep links (rnvtest://scenario/<name>),
// background audio, PiP, and Android cleartext HTTP to the local fixture server. Applied
// via app.json's "plugins" — no generated-project edits. See e2e/CONTEXT.md ("Gotchas
// found while building the MVP scaffold") for the investigation this came out of, and
// test-app/patches/ for the one Android-side patch
// this setup still needs (deep links dropped in singleApp mode — not fixable via a plugin
// alone, see that patch's own comment).
//
// IMPORTANT: unlike iOS (which regenerates Info.plist from a template on every `pod
// install`), react-native-test-app's Android config-plugin step mutates
// node_modules/react-native-test-app's OWN AndroidManifest.xml IN PLACE, and reruns on
// every gradle build/sync. Every mod here must be idempotent (check-before-add) or the
// manifest accumulates duplicate intent-filters on every single build.
import { withAndroidManifest, withInfoPlist } from "@expo/config-plugins";

const URL_SCHEME = "rnvtest";

function withDeepLinkAndBackgroundAudio(config) {
  return withInfoPlist(config, (config) => {
    const urlTypes = (config.modResults.CFBundleURLTypes ??= []);
    if (!urlTypes.some((t) => t.CFBundleURLSchemes?.includes(URL_SCHEME))) {
      urlTypes.push({ CFBundleURLSchemes: [URL_SCHEME] });
    }

    const backgroundModes = (config.modResults.UIBackgroundModes ??= []);
    if (!backgroundModes.includes("audio")) {
      backgroundModes.push("audio");
    }

    return config;
  });
}

function withAndroidDeepLinkAndCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];
    app.$["android:usesCleartextTraffic"] = "true";
    app.$["android:supportsPictureInPicture"] = "true";

    // MainActivity is the LAUNCHER activity, so it's what the OS routes rnvtest:// opens
    // to. In singleApp mode it immediately redirects to ComponentActivity (the real
    // content host) — see test-app/patches/react-native-test-app+*.patch for why the
    // intent-filter still has to live here rather than on ComponentActivity directly.
    const activity = app.activity.find((a) =>
      (a["intent-filter"] ?? []).some((f) =>
        (f.category ?? []).some(
          (c) => c.$["android:name"] === "android.intent.category.LAUNCHER"
        )
      )
    );
    activity.$["android:supportsPictureInPicture"] = "true";
    activity["intent-filter"] = activity["intent-filter"] ?? [];
    const hasUrlScheme = activity["intent-filter"].some((f) =>
      (f.data ?? []).some((d) => d.$["android:scheme"] === URL_SCHEME)
    );
    if (!hasUrlScheme) {
      activity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": URL_SCHEME } }],
      });
    }

    // ComponentActivity is the actual content host in singleApp mode, so PiP needs the
    // attribute there too (this one IS a plain manifest attribute, no Intent-extras
    // problem like the deep-link case above).
    const componentActivity = app.activity.find((a) =>
      a.$["android:name"].endsWith(".ComponentActivity")
    );
    if (componentActivity) {
      componentActivity.$["android:supportsPictureInPicture"] = "true";
    }

    return config;
  });
}

export default function withRnvE2e(config) {
  config = withDeepLinkAndBackgroundAudio(config);
  config = withAndroidDeepLinkAndCleartext(config);
  return config;
}
