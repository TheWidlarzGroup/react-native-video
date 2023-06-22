#import <React/RCTBridge.h>
#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(RNCVideoManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(drm, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(adTagUrl, NSString);
RCT_EXPORT_VIEW_PROPERTY(maxBitRate, float);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
RCT_EXPORT_VIEW_PROPERTY(automaticallyWaitsToMinimizeStalling, BOOL);
RCT_EXPORT_VIEW_PROPERTY(allowsExternalPlayback, BOOL);
RCT_EXPORT_VIEW_PROPERTY(textTracks, NSArray);
RCT_EXPORT_VIEW_PROPERTY(selectedTextTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(selectedAudioTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(playInBackground, BOOL);
RCT_EXPORT_VIEW_PROPERTY(preventsDisplaySleepDuringVideoPlayback, BOOL);
RCT_EXPORT_VIEW_PROPERTY(preferredForwardBufferDuration, float);
RCT_EXPORT_VIEW_PROPERTY(playWhenInactive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(pictureInPicture, BOOL);
RCT_EXPORT_VIEW_PROPERTY(ignoreSilentSwitch, NSString);
RCT_EXPORT_VIEW_PROPERTY(mixWithOthers, NSString);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
RCT_EXPORT_VIEW_PROPERTY(fullscreenAutorotate, BOOL);
RCT_EXPORT_VIEW_PROPERTY(fullscreenOrientation, NSString);
RCT_EXPORT_VIEW_PROPERTY(filter, NSString);
RCT_EXPORT_VIEW_PROPERTY(filterEnabled, BOOL);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);
RCT_EXPORT_VIEW_PROPERTY(restoreUserInterfaceForPIPStopCompletionHandler, BOOL);
RCT_EXPORT_VIEW_PROPERTY(localSourceEncryptionKeyScheme, NSString);

/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */
RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoBuffer, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onBandwidthUpdate, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTimedMetadata, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoAudioBecomingNoisy, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoExternalPlaybackChange, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onGetLicense, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPictureInPictureStatusChanged, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRestoreUserInterfaceForPictureInPictureStop, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onReceiveAdEvent, RCTDirectEventBlock);

RCT_EXTERN_METHOD(save:(nonnull NSNumber *)reactTag: options(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(setLicenseResult:(nonnull NSNumber *)reactTag: license(NSString *)license);

RCT_EXTERN_METHOD(setLicenseResultError:(nonnull NSNumber *)reactTag error:(NSString *)error);

RCT_EXTERN_METHOD(seek:(nonnull NSNumber *)reactTag time:(nonnull NSNumber *) timeValue tolerance:(nonnull NSNumber *) toleranceValue)

@end
