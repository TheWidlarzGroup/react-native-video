//
//  RCTVideoPlayerViewController.m
//  RCTVideo
//
//  Created by Stanisław Chmiela on 31.03.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTVideoPlayerViewController.h"

@interface RCTVideoPlayerViewController ()

@end

@implementation RCTVideoPlayerViewController

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
