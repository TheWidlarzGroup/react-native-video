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

@end
