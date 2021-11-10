#import <Foundation/Foundation.h>
#import "AVKit/AVKit.h"

@protocol RCTVideoPlayerDelegate <NSObject>
- (void)playerDidAppear:(AVPlayer *)player;
- (void)playerDidDisappear;
@end
