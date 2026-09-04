#import <React/RCTViewManager.h>
#import "RCTVideoViewComponentView.h"

@interface RCTVideoViewViewManager : RCTViewManager
@end

@implementation RCTVideoViewViewManager

RCT_EXPORT_MODULE(RNCVideoView)
RCT_EXPORT_VIEW_PROPERTY(nitroId, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(onNitroIdChange, RCTDirectEventBlock)

- (UIView *)view {
  return [[RCTVideoViewComponentView alloc] init];
}

@end
