#if __has_include(<React/RCTViewManager.h>)
#import <React/RCTViewManager.h>
#elif __has_include("React/RCTViewManager.h")
#import "React/RCTViewManager.h"
#elif __has_include("RCTViewManager.h")
#import "RCTViewManager.h"
#endif
@interface RCTVideoManager : RCTViewManager

@end
