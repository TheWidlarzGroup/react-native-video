//
//  RCTVideoPlayerViewController.h
//  RCTVideo
//
//  Created by Stanisław Chmiela on 31.03.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <AVKit/AVKit.h>
#import <UIKit/UIKit.h>
#import "RCTVideo.h"
#import "RCTVideoPlayerViewControllerDelegate.h"
@import AVDoris;

@interface RCTVideoPlayerViewController : AVPlayerViewController <AVDorisDelegate, AVPlayerViewControllerDelegate>
@property (nonatomic, weak) id<RCTVideoPlayerViewControllerDelegate> rctDelegate;
@property (nonatomic, strong) UIView *adView;
@property(nonatomic, getter=isAdBreakActive) BOOL adBreakActive;
@end
