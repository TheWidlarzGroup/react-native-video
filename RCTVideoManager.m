#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import "RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoManager

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[RCTVideo alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */

- (NSDictionary *)customDirectEventTypes
{
  return @{
    @"videoLoaded": @{
      @"registrationName": @"onLoad"
    },
    @"videoProgress": @{
      @"registrationName": @"onProgress"
    },
  };
}

RCT_EXPORT_VIEW_PROPERTY(src, NSString);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
RCT_EXPORT_VIEW_PROPERTY(pause, BOOL);

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

@end
