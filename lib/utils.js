"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReactTag = exports.resolveAssetSourceForVideo = exports.generateHeaderForNative = void 0;
const react_native_1 = require("react-native");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateHeaderForNative(obj) {
    if (!obj) {
        return [];
    }
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
}
exports.generateHeaderForNative = generateHeaderForNative;
function resolveAssetSourceForVideo(source) {
    // will convert source id to uri
    const convertToUri = (sourceItem) => {
        const resolveItem = react_native_1.Image.resolveAssetSource(sourceItem);
        if (resolveItem) {
            return resolveItem.uri;
        }
        else {
            console.warn('cannot resolve item ', sourceItem);
            return undefined;
        }
    };
    // This is deprecated, but we need to support it for backward compatibility
    if (typeof source === 'number') {
        return {
            uri: convertToUri(source),
        };
    }
    if ('uri' in source && typeof source.uri === 'number') {
        return {
            ...source,
            uri: convertToUri(source.uri),
        };
    }
    return source;
}
exports.resolveAssetSourceForVideo = resolveAssetSourceForVideo;
/**
 * @deprecated
 * Do not use this fn anymore. "findNodeHandle" will be deprecated.
 * */
function getReactTag(ref) {
    if (!ref.current) {
        throw new Error('Video Component is not mounted');
    }
    const reactTag = (0, react_native_1.findNodeHandle)(ref.current);
    if (!reactTag) {
        throw new Error('Cannot find reactTag for Video Component in components tree');
    }
    return reactTag;
}
exports.getReactTag = getReactTag;
//# sourceMappingURL=utils.js.map