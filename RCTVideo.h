#import "RCTView.h"

extern NSString *const RNVideoLoadedEvent;
extern NSString *const RNVideoLoadingEvent;
extern NSString *const RNVideoProgressEvent;
extern NSString *const RNVideoLoadingErrorEvent;

@class RCTEventDispatcher;

@interface RCTVideo : UIView

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@end
