#import "RCTVideoPlayerViewController.h"

@interface RCTVideoPlayerViewController ()

@end

@implementation RCTVideoPlayerViewController

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [_rctDelegate videoPlayerViewControllerWillDismiss:self];
  [_rctDelegate videoPlayerViewControllerDidDismiss:self];
}

- (BOOL)shouldAutorotate
{
    return _autoRotate;
}

#if !TARGET_OS_TV

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    return _fullScreenOrientation;
}

#endif

@end
