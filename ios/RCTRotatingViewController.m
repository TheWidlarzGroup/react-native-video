//
//  RCTRotatingViewController.m
//  RCTVideo
//
//  Created by June Kim on 2/14/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTRotatingViewController.h"
#include "RCTMotionManager.h"
#import <math.h>
#import "OvalCalculator.h"

@interface RCTRotatingViewController ()

@end

@implementation RCTRotatingViewController{
  RCTMotionManager *_motionManager;
  OvalCalculator *_scaler;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.layer.needsDisplayOnBoundsChange = YES;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationWillResignActive:)
                                               name:UIApplicationWillResignActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationDidEnterBackground:)
                                               name:UIApplicationDidEnterBackgroundNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationWillEnterForeground:)
                                               name:UIApplicationWillEnterForegroundNotification
                                             object:nil];

}

- (void) startRotatingIfNeeded {
  if (!_frameless) {
    [self reset];
  } else {
    [self startRotating];
  }
}

- (void) startRotating {
  _motionManager = [[RCTMotionManager alloc] init];
  if (_isLocked) {
    [_motionManager lock];
  }
  self.view.transform = [_motionManager getZeroRotationTransform];

  [_motionManager setVideoWidth:self.videoWidth
                    videoHeight:self.videoHeight
                      viewWidth:self.view.bounds.size.width
                     viewHeight:self.view.bounds.size.height];
  __weak RCTRotatingViewController *weakSelf = self;
  [_motionManager startDeviceMotionUpdatesWithHandler:^(CGAffineTransform transform) {
    if (weakSelf == nil) { return; }
    weakSelf.view.transform = transform;
  }];

}

- (void) reset {
  if (_motionManager) {
    [_motionManager stopDeviceMotionUpdates];
    _motionManager = nil;
  }
  self.view.transform = CGAffineTransformIdentity;
}

- (void)setIsLocked:(BOOL)isLocked {
  if (isLocked) {
    [_motionManager lock];
  } else {
    if (_isLocked) {
      [_motionManager unLock];
    }
  }
  _isLocked = isLocked;
}

- (void)applicationWillResignActive:(NSNotification *)notification {
  [self reset];
}

- (void)applicationDidEnterBackground:(NSNotification *)notification {
  [self reset];
}

- (void)applicationWillEnterForeground:(NSNotification *)notification {
  [self startRotatingIfNeeded];
}

- (void) dealloc {
  [self reset];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


@end
