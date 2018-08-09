#import "RCTVideoPlayerViewController.h"

@interface RCTVideoPlayerViewController ()

@end

@implementation RCTVideoPlayerViewController

- (id)init {
  self = [super init];
  if (self) {
    self.autorotate = false;
  }
  return self;
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [_rctDelegate videoPlayerViewControllerWillDismiss:self];
  [_rctDelegate videoPlayerViewControllerDidDismiss:self];
}

- (BOOL)shouldAutorotate {
  return self.autorotate;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
  
  return UIInterfaceOrientationMaskAll;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
  if ([self.preferredOrientation.lowercaseString isEqualToString:@"landscape"]) {
    return UIInterfaceOrientationLandscapeLeft;
  }
  else if ([self.preferredOrientation.lowercaseString isEqualToString:@"portrait"]) {
    return UIInterfaceOrientationPortrait;
  }
  else { // default case
    UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
    return orientation;
  }
}

@end
