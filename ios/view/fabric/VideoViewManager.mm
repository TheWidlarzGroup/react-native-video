#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"

@interface VideoViewManager : RCTViewManager
@end

@implementation VideoViewManager

RCT_EXPORT_MODULE(VideoView)

RCT_EXPORT_VIEW_PROPERTY(nitroId, NSNumber)

@end
