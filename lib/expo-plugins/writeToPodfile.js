"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToPodfile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const writeToPodfile = (projectRoot, key, value, testApp = false) => {
    const podfilePath = path_1.default.join(projectRoot, 'ios', 'Podfile');
    const podfileContent = fs_1.default.readFileSync(podfilePath, 'utf8');
    if (podfileContent.includes(`$${key} =`)) {
        console.warn(`RNV - Podfile already contains a definition for "$${key}". Skipping...`);
        return;
    }
    if (testApp) {
        mergeTestAppPodfile(podfileContent, podfilePath, key, value);
    }
    else {
        mergeExpoPodfile(podfileContent, podfilePath, key, value);
    }
};
exports.writeToPodfile = writeToPodfile;
const mergeTestAppPodfile = (podfileContent, podfilePath, key, value) => {
    // We will try to inject the variable definition above the `use_test_app!` call in the Podfile.
    const newPodfileContent = (0, generateCode_1.mergeContents)({
        tag: `rn-video-set-${key.toLowerCase()}`,
        src: podfileContent,
        newSrc: `$${key} = ${value}`,
        anchor: /use_test_app!/,
        offset: -1,
        comment: '#',
    });
    // Write to Podfile only if the merge was successful
    if (newPodfileContent.didMerge) {
        fs_1.default.writeFileSync(podfilePath, newPodfileContent.contents);
    }
    else {
        console.warn(`RNV - Failed to write "$${key} = ${value}" to Test App Podfile`);
    }
};
const mergeExpoPodfile = (podfileContent, podfilePath, key, value) => {
    const newPodfileContent = (0, generateCode_1.mergeContents)({
        tag: `rn-video-set-${key.toLowerCase()}`,
        src: podfileContent,
        newSrc: `$${key} = ${value}`,
        anchor: /platform :ios/,
        offset: 0,
        comment: '#',
    });
    if (newPodfileContent.didMerge) {
        fs_1.default.writeFileSync(podfilePath, newPodfileContent.contents);
    }
    else {
        console.warn(`RNV - Failed to write "$${key} = ${value}" to Podfile`);
    }
};
//# sourceMappingURL=writeToPodfile.js.map