//
//  RCTVideoPlayerViewControllerDelegate.h
//  RCTVideo
//
//  Created by Stanisław Chmiela on 01.04.2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AVKit/AVKit.h"

@protocol RCTVideoPlayerViewControllerDelegate <NSObject>
- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;
@end
