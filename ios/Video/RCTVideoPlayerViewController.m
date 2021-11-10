#import "RCTVideoPlayerViewController.h"

@interface RCTVideoPlayerViewController ()

@end

@implementation RCTVideoPlayerViewController

static id<RCTVideoPlayerDelegate> _videoPlayerDelegate = nil;

+ (void)setVideoPlayerDelegate:(id<RCTVideoPlayerDelegate>)videoPlayerDelegate {
  _videoPlayerDelegate = videoPlayerDelegate;
}

+ (id<RCTVideoPlayerDelegate>) videoPlayerDelegate { return _videoPlayerDelegate; }

- (BOOL)shouldAutorotate {

  if (self.autorotate || self.preferredOrientation.lowercaseString == nil || [self.preferredOrientation.lowercaseString isEqualToString:@"all"])
    return YES;
  
  return NO;
}
- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  if (_videoPlayerDelegate != nil) {
    [_videoPlayerDelegate playerDidAppear:self.player];
  }
}
- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [_rctDelegate videoPlayerViewControllerWillDismiss:self];
  [_rctDelegate videoPlayerViewControllerDidDismiss:self];
  if (_videoPlayerDelegate != nil) {
    [_videoPlayerDelegate playerDidDisappear];
  }
}

#if !TARGET_OS_TV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
  return UIInterfaceOrientationMaskAll;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
  if ([self.preferredOrientation.lowercaseString isEqualToString:@"landscape"]) {
    return UIInterfaceOrientationLandscapeRight;
  }
  else if ([self.preferredOrientation.lowercaseString isEqualToString:@"portrait"]) {
    return UIInterfaceOrientationPortrait;
  }
  else { // default case
    UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
    return orientation;
  }
}
#endif

@end
