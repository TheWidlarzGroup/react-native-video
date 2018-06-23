//
//  RCTVideoPlayerViewController.h
//  RCTVideo
//
//  Created by Stanisław Chmiela on 31.03.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <AVKit/AVKit.h>
#import "RCTVideo.h"
#import "RCTVideoPlayerViewControllerDelegate.h"

@interface RCTVideoPlayerViewController : AVPlayerViewController
@property (nonatomic, weak) id<RCTVideoPlayerViewControllerDelegate> rctDelegate;
@property (nonatomic, assign) BOOL autoRotate;
#if !TARGET_OS_TV
@property (nonatomic, assign) UIInterfaceOrientationMask fullScreenOrientation;
#endif
@end
