"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoDecoderProperties = void 0;
const react_native_1 = require("react-native");
const NativeVideoDecoderInfoModule_1 = __importDefault(require("./specs/NativeVideoDecoderInfoModule"));
const errMsgGen = (moduleName, propertyName) => `The method or property ${moduleName}.${propertyName} is not available on ${react_native_1.Platform.OS}.`;
exports.VideoDecoderProperties = {
    async getWidevineLevel() {
        if (react_native_1.Platform.OS !== 'android') {
            throw new Error(errMsgGen('VideoDecoderProperties', 'getWidevineLevel'));
        }
        return NativeVideoDecoderInfoModule_1.default.getWidevineLevel();
    },
    async isCodecSupported(...args) {
        if (react_native_1.Platform.OS !== 'android') {
            throw new Error(errMsgGen('VideoDecoderProperties', 'isCodecSupported'));
        }
        return NativeVideoDecoderInfoModule_1.default.isCodecSupported(...args);
    },
    async isHEVCSupported() {
        if (react_native_1.Platform.OS !== 'android') {
            throw new Error(errMsgGen('VideoDecoderProperties', 'isHEVCSupported'));
        }
        return NativeVideoDecoderInfoModule_1.default.isHEVCSupported();
    },
};
//# sourceMappingURL=VideoDecoderProperties.js.map