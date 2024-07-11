#import "AVKit/AVKit.h"
#import <Foundation/Foundation.h>

@protocol RCTVideoPlayerViewControllerDelegate <NSObject>
- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController*)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController*)playerViewController;
@end
