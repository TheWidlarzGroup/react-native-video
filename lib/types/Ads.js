"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdEvent = void 0;
var AdEvent;
(function (AdEvent) {
    /**
     * iOS only: Fired the first time each ad break ends. Applications must reenable seeking when this occurs (only used for dynamic ad insertion).
     */
    AdEvent["AD_BREAK_ENDED"] = "AD_BREAK_ENDED";
    /**
     * Fires when an ad rule or a VMAP ad break would have played if autoPlayAdBreaks is false.
     */
    AdEvent["AD_BREAK_READY"] = "AD_BREAK_READY";
    /**
     * iOS only: Fired first time each ad break begins playback. If an ad break is watched subsequent times this will not be fired. Applications must disable seeking when this occurs (only used for dynamic ad insertion).
     */
    AdEvent["AD_BREAK_STARTED"] = "AD_BREAK_STARTED";
    /**
     * Android only: Fires when the ad has stalled playback to buffer.
     */
    AdEvent["AD_BUFFERING"] = "AD_BUFFERING";
    /**
     * Android only: Fires when the ad is ready to play without buffering, either at the beginning of the ad or after buffering completes.
     */
    AdEvent["AD_CAN_PLAY"] = "AD_CAN_PLAY";
    /**
     * Android only: Fires when an ads list is loaded.
     */
    AdEvent["AD_METADATA"] = "AD_METADATA";
    /**
     * iOS only: Fired every time the stream switches from advertising or slate to content. This will be fired even when an ad is played a second time or when seeking into an ad (only used for dynamic ad insertion).
     */
    AdEvent["AD_PERIOD_ENDED"] = "AD_PERIOD_ENDED";
    /**
     * iOS only: Fired every time the stream switches from content to advertising or slate. This will be fired even when an ad is played a second time or when seeking into an ad (only used for dynamic ad insertion).
     */
    AdEvent["AD_PERIOD_STARTED"] = "AD_PERIOD_STARTED";
    /**
     * Android only: Fires when the ad's current time value changes. The event `data` will be populated with an AdProgressData object.
     */
    AdEvent["AD_PROGRESS"] = "AD_PROGRESS";
    /**
     * Fires when the ads manager is done playing all the valid ads in the ads response, or when the response doesn't return any valid ads.
     */
    AdEvent["ALL_ADS_COMPLETED"] = "ALL_ADS_COMPLETED";
    /**
     * Fires when the ad is clicked.
     */
    AdEvent["CLICK"] = "CLICK";
    /**
     * Fires when the ad completes playing.
     */
    AdEvent["COMPLETED"] = "COMPLETED";
    /**
     * Android only: Fires when content should be paused. This usually happens right before an ad is about to cover the content.
     */
    AdEvent["CONTENT_PAUSE_REQUESTED"] = "CONTENT_PAUSE_REQUESTED";
    /**
     * Android only: Fires when content should be resumed. This usually happens when an ad finishes or collapses.
     */
    AdEvent["CONTENT_RESUME_REQUESTED"] = "CONTENT_RESUME_REQUESTED";
    /**
     * iOS only: Cuepoints changed for VOD stream (only used for dynamic ad insertion).
     */
    AdEvent["CUEPOINTS_CHANGED"] = "CUEPOINTS_CHANGED";
    /**
     * Android only: Fires when the ad's duration changes.
     */
    AdEvent["DURATION_CHANGE"] = "DURATION_CHANGE";
    /**
     * Fires when an error is encountered and the ad can't be played.
     */
    AdEvent["ERROR"] = "ERROR";
    /**
     * Fires when the ad playhead crosses first quartile.
     */
    AdEvent["FIRST_QUARTILE"] = "FIRST_QUARTILE";
    /**
     * Android only: Fires when the impression URL has been pinged.
     */
    AdEvent["IMPRESSION"] = "IMPRESSION";
    /**
     * Android only: Fires when an ad triggers the interaction callback. Ad interactions contain an interaction ID string in the ad data.
     */
    AdEvent["INTERACTION"] = "INTERACTION";
    /**
     * Android only: Fires when the displayed ad changes from linear to nonlinear, or the reverse.
     */
    AdEvent["LINEAR_CHANGED"] = "LINEAR_CHANGED";
    /**
     * Fires when ad data is available.
     */
    AdEvent["LOADED"] = "LOADED";
    /**
     * Fires when a non-fatal error is encountered. The user need not take any action since the SDK will continue with the same or next ad playback depending on the error situation.
     */
    AdEvent["LOG"] = "LOG";
    /**
     * Fires when the ad playhead crosses midpoint.
     */
    AdEvent["MIDPOINT"] = "MIDPOINT";
    /**
     * Fires when the ad is paused.
     */
    AdEvent["PAUSED"] = "PAUSED";
    /**
     * Fires when the ad is resumed.
     */
    AdEvent["RESUMED"] = "RESUMED";
    /**
     * Android only: Fires when the displayed ads skippable state is changed.
     */
    AdEvent["SKIPPABLE_STATE_CHANGED"] = "SKIPPABLE_STATE_CHANGED";
    /**
     * Fires when the ad is skipped by the user.
     */
    AdEvent["SKIPPED"] = "SKIPPED";
    /**
     * Fires when the ad starts playing.
     */
    AdEvent["STARTED"] = "STARTED";
    /**
     * iOS only: Stream request has loaded (only used for dynamic ad insertion).
     */
    AdEvent["STREAM_LOADED"] = "STREAM_LOADED";
    /**
     * iOS only: Fires when the ad is tapped.
     */
    AdEvent["TAPPED"] = "TAPPED";
    /**
     * Fires when the ad playhead crosses third quartile.
     */
    AdEvent["THIRD_QUARTILE"] = "THIRD_QUARTILE";
    /**
     * iOS only: An unknown event has fired
     */
    AdEvent["UNKNOWN"] = "UNKNOWN";
    /**
     * Android only: Fires when the ad is closed by the user.
     */
    AdEvent["USER_CLOSE"] = "USER_CLOSE";
    /**
     * Android only: Fires when the non-clickthrough portion of a video ad is clicked.
     */
    AdEvent["VIDEO_CLICKED"] = "VIDEO_CLICKED";
    /**
     * Android only: Fires when a user clicks a video icon.
     */
    AdEvent["VIDEO_ICON_CLICKED"] = "VIDEO_ICON_CLICKED";
    /**
     * Android only: Fires when the ad volume has changed.
     */
    AdEvent["VOLUME_CHANGED"] = "VOLUME_CHANGED";
    /**
     * Android only: Fires when the ad volume has been muted.
     */
    AdEvent["VOLUME_MUTED"] = "VOLUME_MUTED";
})(AdEvent || (exports.AdEvent = AdEvent = {}));
//# sourceMappingURL=Ads.js.map