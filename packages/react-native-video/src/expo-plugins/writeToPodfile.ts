import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';
import fs from 'node:fs';
import path from 'node:path';

export const writeToPodfile = (
  projectRoot: string,
  key: string,
  value: string,
  testApp: boolean = false
) => {
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  const podfileContent = fs.readFileSync(podfilePath, 'utf8');

  if (podfileContent.includes(`$${key} =`)) {
    console.warn(
      `RNV - Podfile already contains a definition for "$${key}". Skipping...`
    );
    return;
  }

  // mergeContents throws ERR_NO_MATCH when its anchor is missing rather than reporting
  // `didMerge: false`; a Podfile this plugin does not understand should warn, not abort
  // prebuild. Anything else (e.g. a Podfile that cannot be written) is a real failure.
  try {
    if (testApp) {
      mergeTestAppPodfile(podfileContent, podfilePath, key, value);
    } else {
      mergeExpoPodfile(podfileContent, podfilePath, key, value);
    }
  } catch (error) {
    if ((error as { code?: unknown }).code !== 'ERR_NO_MATCH') {
      throw error;
    }
    const anchor = testApp ? 'use_test_app!' : 'platform :ios';
    console.warn(
      `RNV - Failed to write "$${key} = ${value}" to Podfile: could not find \`${anchor}\`. Add the line to ios/Podfile yourself.`
    );
  }
};

const mergeTestAppPodfile = (
  podfileContent: string,
  podfilePath: string,
  key: string,
  value: string
) => {
  // We will try to inject the variable definition above the `use_test_app!` call in the Podfile.
  const newPodfileContent = mergeContents({
    tag: `rn-video-set-${key.toLowerCase()}`,
    src: podfileContent,
    newSrc: `$${key} = ${value}`,
    anchor: /use_test_app!/,
    offset: -1, // Insert the key-value pair just above the `use_test_app!` call.
    comment: '#',
  });

  // Write to Podfile only if the merge was successful
  if (newPodfileContent.didMerge) {
    fs.writeFileSync(podfilePath, newPodfileContent.contents);
  } else {
    console.warn(
      `RNV - Failed to write "$${key} = ${value}" to Test App Podfile`
    );
  }
};

const mergeExpoPodfile = (
  podfileContent: string,
  podfilePath: string,
  key: string,
  value: string
) => {
  const newPodfileContent = mergeContents({
    tag: `rn-video-set-${key.toLowerCase()}`,
    src: podfileContent,
    newSrc: `$${key} = ${value}`,
    anchor: /platform :ios/,
    offset: 0,
    comment: '#',
  });

  if (newPodfileContent.didMerge) {
    fs.writeFileSync(podfilePath, newPodfileContent.contents);
  } else {
    console.warn(`RNV - Failed to write "$${key} = ${value}" to Podfile`);
  }
};
