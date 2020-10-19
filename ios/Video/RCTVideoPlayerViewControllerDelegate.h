#import <Foundation/Foundation.h>
#import "AVKit/AVKit.h"

@protocol RCTVideoPlayerViewControllerDelegate <NSObject>
- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;
- (void)didRequestAdTagParametersUpdate:(NSTimeInterval)timeIntervalSince1970;
@end
