//
//  RCTVideoPlayerViewController.h
//  RCTVideo
//
//  Created by Stanisław Chmiela on 31.03.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTVideo.h"
#import "RCTVideoPlayerViewControllerDelegate.h"
#import <AVKit/AVKit.h>

@interface RCTVideoPlayerViewController : AVPlayerViewController
@property(nonatomic, weak) id<RCTVideoPlayerViewControllerDelegate> rctDelegate;

// Optional paramters
@property(nonatomic, weak) NSString* preferredOrientation;
@property(nonatomic) BOOL autorotate;

@end
