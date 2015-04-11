#import "RCTView.h"

extern NSString *const RNVideoEventLoaded;
extern NSString *const RNVideoEventLoading;
extern NSString *const RNVideoEventProgress;
extern NSString *const RNVideoEventSeek;
extern NSString *const RNVideoEventLoadingError;
extern NSString *const RNVideoEventEnd;

@class RCTEventDispatcher;

@interface RCTVideo : UIView

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@end
