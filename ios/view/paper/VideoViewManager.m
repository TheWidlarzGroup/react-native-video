#import <React/RCTViewManager.h>
#import "RCTEventDispatcher.h"
#import "VideoView.h"

@interface ViewViewManager : RCTViewManager
@end

@implementation ViewViewManager

RCT_EXPORT_MODULE(VideoView)
RCT_EXPORT_VIEW_PROPERTY(nitroId, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(onNitroIdChange, RCTDirectEventBlock)

- (UIView *)view {
  return [[VideoView alloc] init];
}

@end
