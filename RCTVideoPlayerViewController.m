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

- (IBAction)close:(id)sender
{
    [self.rctVideoView setFullscreen:false];
}

@end
