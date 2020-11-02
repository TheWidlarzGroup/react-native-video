#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import <React/RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <React/RCTUIManager.h>

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
RCT_EXPORT_VIEW_PROPERTY(allowsExternalPlayback, BOOL);
RCT_EXPORT_VIEW_PROPERTY(textTracks, NSArray);
RCT_EXPORT_VIEW_PROPERTY(selectedTextTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(selectedAudioTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(playInBackground, BOOL);
RCT_EXPORT_VIEW_PROPERTY(playWhenInactive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(ignoreSilentSwitch, NSString);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(seek, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);
/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */
RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoBuffer, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTimedMetadata, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoAudioBecomingNoisy, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRequireAdParameters, RCTBubblingEventBlock);

RCT_EXPORT_METHOD(replaceAdTagParameters:(nonnull NSNumber *)node payload:(NSDictionary *)payload) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTVideo *view = (RCTVideo *)viewRegistry[node];
    if ([view isKindOfClass:[RCTVideo class]]) {
      NSMutableDictionary* _adTagParameters = [NSMutableDictionary new];
      NSDate *_Nullable _startDate;
      NSDate *_Nullable _endDate;
      
      id adTagParameters = [payload objectForKey:@"adTagParameters"];
      id startDate = [payload objectForKey:@"startDate"];
      id endDate = [payload objectForKey:@"endDate"];

      if (adTagParameters &&
          [adTagParameters isKindOfClass:NSDictionary.class]) {
        _adTagParameters = adTagParameters;
      }
      
      if (startDate &&
          [startDate isKindOfClass:NSNumber.class]) {
        _startDate = [[NSDate alloc] initWithTimeIntervalSince1970:[startDate doubleValue]];
      }
      
      if (endDate &&
          [endDate isKindOfClass:NSNumber.class]) {
        _endDate = [[NSDate alloc] initWithTimeIntervalSince1970:[endDate doubleValue]];
      }
      
      [view.player replaceAdTagParametersWithAdTagParameters:_adTagParameters
                                                   validFrom: _startDate
                                                  validUntil:_endDate];
    }
  }];
};

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
