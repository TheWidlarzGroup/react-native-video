#import "RCTVideoPlayerViewController.h"

@interface RCTVideoPlayerViewController ()

@end

@implementation RCTVideoPlayerViewController

BOOL _viewWillAppearCalled = NO;

- (void)viewDidLoad
{
    [super viewDidLoad];
    _viewWillAppearCalled = NO;
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    if (_rctDelegate == nil || _viewWillAppearCalled)
    {
        [self dismissViewControllerAnimated:YES completion:nil];
    }
    _viewWillAppearCalled = YES;
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
    [_rctDelegate videoPlayerViewControllerDidDismiss:self];
}

- (void)viewWillDisappear:(BOOL)animated {
    [_rctDelegate videoPlayerViewControllerWillDismiss:self];
    [super viewWillDisappear:animated];
}

@end
