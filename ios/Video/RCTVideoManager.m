#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoManager

RCT_EXPORT_MODULE();

- (UIView *)view
{
  return [[RCTVideo alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

- (dispatch_queue_t)methodQueue
{
    return self.bridge.uiManager.methodQueue;
}

RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(drm, NSDictionary);
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
RCT_EXPORT_VIEW_PROPERTY(seek, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
RCT_EXPORT_VIEW_PROPERTY(fullscreenAutorotate, BOOL);
RCT_EXPORT_VIEW_PROPERTY(fullscreenOrientation, NSString);
RCT_EXPORT_VIEW_PROPERTY(filter, NSString);
RCT_EXPORT_VIEW_PROPERTY(filterEnabled, BOOL);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);
RCT_EXPORT_VIEW_PROPERTY(restoreUserInterfaceForPIPStopCompletionHandler, BOOL);
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
RCT_REMAP_METHOD(save,
        options:(NSDictionary *)options
        reactTag:(nonnull NSNumber *)reactTag
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager prependUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTVideo *> *viewRegistry) {
        RCTVideo *view = viewRegistry[reactTag];
        if (![view isKindOfClass:[RCTVideo class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting RCTVideo, got: %@", view);
        } else {
            [view save:options resolve:resolve reject:reject];
        }
    }];
};
RCT_REMAP_METHOD(setLicenseResult,
         license:(NSString *)license
         reactTag:(nonnull NSNumber *)reactTag)
{
    [self.bridge.uiManager prependUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTVideo *> *viewRegistry) {
        RCTVideo *view = viewRegistry[reactTag];
        if (![view isKindOfClass:[RCTVideo class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting RCTVideo, got: %@", view);
        } else {
            [view setLicenseResult:license];
        }
    }];
};

RCT_REMAP_METHOD(setLicenseResultError,
                 error:(NSString *)error
                 reactTag:(nonnull NSNumber *)reactTag)
{
    [self.bridge.uiManager prependUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTVideo *> *viewRegistry) {
        RCTVideo *view = viewRegistry[reactTag];
        if (![view isKindOfClass:[RCTVideo class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting RCTVideo, got: %@", view);
        } else {
            [view setLicenseResultError:error];
        }
    }];
};
RCT_EXPORT_VIEW_PROPERTY(onPictureInPictureStatusChanged, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRestoreUserInterfaceForPictureInPictureStop, RCTDirectEventBlock);

- (NSDictionary *)constantsToExport
{
  return @{
    @"ScaleNone": AVLayerVideoGravityResizeAspect,
    @"ScaleToFill": AVLayerVideoGravityResize,
    @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
    @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill
  };
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

@end
