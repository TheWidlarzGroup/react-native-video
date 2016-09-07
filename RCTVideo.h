#import "RCTView.h"
#import <AVFoundation/AVFoundation.h>
#import "AVKit/AVKit.h"
#import "UIView+FindUIViewController.h"
#import "RCTVideoPlayerViewController.h"
#import "RCTVideoPlayerViewControllerDelegate.h"

typedef void(^ImageExtractionHandler)(int percentOfCompletion, NSArray *savedImagesPathArray, NSError *err);

@class RCTEventDispatcher;

@interface RCTVideo : UIView <RCTVideoPlayerViewControllerDelegate>

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (AVPlayerViewController*)createPlayerViewController:(AVPlayer*)player withPlayerItem:(AVPlayerItem*)playerItem;

- (NSArray *)getFrames:(ImageExtractionHandler)completionHandler;

@end
