#import <Foundation/Foundation.h>
#import "AVKit/AVKit.h"
@import AVDoris;

@protocol RCTVideoPlayerViewControllerDelegate <NSObject>
- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;
- (void)didRequestAdTagParametersUpdate:(NSTimeInterval)timeIntervalSince1970;
- (void)didFailWithError:(AVDorisError)error errorData:(AVDorisErrorData *)errorData;
@end
