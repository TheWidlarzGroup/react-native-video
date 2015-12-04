#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import "RCTBridge.h"
#import "RCTUIManager.h"
#import "RCTSparseArray.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoManager

RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[RCTVideo alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */

- (NSArray *)customDirectEventTypes
{
  return @[
    @"onVideoLoadStart",
    @"onVideoLoad",
    @"onVideoError",
    @"onVideoProgress",
    @"onVideoSeek",
    @"onVideoEnd"
  ];
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
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(seek, float);

RCT_EXPORT_METHOD(attemptStop:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback) {
  RCTVideo *videoView = (RCTVideo *)[self.bridge.uiManager viewForReactTag:reactTag];
  if (!videoView) {
    callback(@[[NSNull null], @(NO)]);
  }
  [videoView stop];
  callback(@[[NSNull null], @(YES)]);
}

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
