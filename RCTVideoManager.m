#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import "RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoManager {
    RCTVideo* _player;
}

RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
    
    _player = [[RCTVideo alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
    return _player;
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
             @"onVideoEnd",
             @"onVideoFullscreenPlayerWillPresent",
             @"onVideoFullscreenPlayerDidPresent",
             @"onVideoFullscreenPlayerWillDismiss",
             @"onVideoFullscreenPlayerDidDismiss",
             @"onReadyForDisplay",
             @"onPlaybackStalled",
             @"onPlaybackResume",
             @"onPlaybackRateChange"
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
RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(playInBackground, BOOL);
RCT_EXPORT_VIEW_PROPERTY(playWhenInactive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(seek, float);
RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);

RCT_EXPORT_METHOD(getFrames:(RCTResponseSenderBlock)callback) {
    
    [_player getFrames: ^(int percent, NSArray *result, NSError *error) {
        if(percent == 100) {
            
            NSLog(@"%@", result);
            callback(@[[NSNull null], result]);
            
        }
    }];
    
    
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
