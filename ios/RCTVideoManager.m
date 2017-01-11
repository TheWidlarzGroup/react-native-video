#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import <React/RCTBridge.h>
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoManager

RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[RCTVideo alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(playInBackground, BOOL);
RCT_EXPORT_VIEW_PROPERTY(playWhenInactive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(seek, float);
RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);
/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */
RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, RCTBubblingEventBlock);

- (NSDictionary *)constantsToExport
{
  return @{
    @"ScaleNone": AVLayerVideoGravityResizeAspect,
    @"ScaleToFill": AVLayerVideoGravityResize,
    @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
    @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill
  };
}

@end
