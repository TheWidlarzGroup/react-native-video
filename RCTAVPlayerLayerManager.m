#import "RCTAVPlayerLayerManager.h"
#import "RCTAVPlayerLayer.h"
#import "RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTAVPlayerLayerManager

RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
    return [[RCTAVPlayerLayer alloc] init];
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

RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(playerUuid, NSString);

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
