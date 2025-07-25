"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterResizeModeType = exports.MixWithOthersType = exports.IgnoreSilentSwitchType = exports.FullscreenOrientationType = exports.TextTrackType = exports.SelectedVideoTrackType = exports.SelectedTrackType = exports.BufferingStrategyType = exports.CmcdMode = exports.DRMType = void 0;
var DRMType;
(function (DRMType) {
    DRMType["WIDEVINE"] = "widevine";
    DRMType["PLAYREADY"] = "playready";
    DRMType["CLEARKEY"] = "clearkey";
    DRMType["FAIRPLAY"] = "fairplay";
})(DRMType || (exports.DRMType = DRMType = {}));
var CmcdMode;
(function (CmcdMode) {
    CmcdMode[CmcdMode["MODE_REQUEST_HEADER"] = 0] = "MODE_REQUEST_HEADER";
    CmcdMode[CmcdMode["MODE_QUERY_PARAMETER"] = 1] = "MODE_QUERY_PARAMETER";
})(CmcdMode || (exports.CmcdMode = CmcdMode = {}));
var BufferingStrategyType;
(function (BufferingStrategyType) {
    BufferingStrategyType["DEFAULT"] = "Default";
    BufferingStrategyType["DISABLE_BUFFERING"] = "DisableBuffering";
    BufferingStrategyType["DEPENDING_ON_MEMORY"] = "DependingOnMemory";
})(BufferingStrategyType || (exports.BufferingStrategyType = BufferingStrategyType = {}));
var SelectedTrackType;
(function (SelectedTrackType) {
    SelectedTrackType["SYSTEM"] = "system";
    SelectedTrackType["DISABLED"] = "disabled";
    SelectedTrackType["TITLE"] = "title";
    SelectedTrackType["LANGUAGE"] = "language";
    SelectedTrackType["INDEX"] = "index";
})(SelectedTrackType || (exports.SelectedTrackType = SelectedTrackType = {}));
var SelectedVideoTrackType;
(function (SelectedVideoTrackType) {
    SelectedVideoTrackType["AUTO"] = "auto";
    SelectedVideoTrackType["DISABLED"] = "disabled";
    SelectedVideoTrackType["RESOLUTION"] = "resolution";
    SelectedVideoTrackType["INDEX"] = "index";
})(SelectedVideoTrackType || (exports.SelectedVideoTrackType = SelectedVideoTrackType = {}));
var TextTrackType;
(function (TextTrackType) {
    TextTrackType["SUBRIP"] = "application/x-subrip";
    TextTrackType["TTML"] = "application/ttml+xml";
    TextTrackType["VTT"] = "text/vtt";
})(TextTrackType || (exports.TextTrackType = TextTrackType = {}));
var FullscreenOrientationType;
(function (FullscreenOrientationType) {
    FullscreenOrientationType["ALL"] = "all";
    FullscreenOrientationType["LANDSCAPE"] = "landscape";
    FullscreenOrientationType["PORTRAIT"] = "portrait";
})(FullscreenOrientationType || (exports.FullscreenOrientationType = FullscreenOrientationType = {}));
var IgnoreSilentSwitchType;
(function (IgnoreSilentSwitchType) {
    IgnoreSilentSwitchType["INHERIT"] = "inherit";
    IgnoreSilentSwitchType["IGNORE"] = "ignore";
    IgnoreSilentSwitchType["OBEY"] = "obey";
})(IgnoreSilentSwitchType || (exports.IgnoreSilentSwitchType = IgnoreSilentSwitchType = {}));
var MixWithOthersType;
(function (MixWithOthersType) {
    MixWithOthersType["INHERIT"] = "inherit";
    MixWithOthersType["MIX"] = "mix";
    MixWithOthersType["DUCK"] = "duck";
})(MixWithOthersType || (exports.MixWithOthersType = MixWithOthersType = {}));
var PosterResizeModeType;
(function (PosterResizeModeType) {
    PosterResizeModeType["CONTAIN"] = "contain";
    PosterResizeModeType["CENTER"] = "center";
    PosterResizeModeType["COVER"] = "cover";
    PosterResizeModeType["NONE"] = "none";
    PosterResizeModeType["REPEAT"] = "repeat";
    PosterResizeModeType["STRETCH"] = "stretch";
})(PosterResizeModeType || (exports.PosterResizeModeType = PosterResizeModeType = {}));
//# sourceMappingURL=video.js.map