//
//  RCTRotatingView.m
//  RCTVideo
//
//  Created by June Kim on 2/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTRotatingView.h"
#include "RCTMotionManager.h"
#import <math.h>
#import "OvalCalculator.h"

@implementation RCTRotatingView {
  RCTMotionManager *_motionManager;
  OvalCalculator *_scaler;
}

- (void) startRotating {
  _motionManager = [[RCTMotionManager alloc] init];
  self.transform = [_motionManager getZeroRotationTransform];
  
  [_motionManager setVideoWidth:self.videoWidth
                    videoHeight:self.videoHeight
                      viewWidth:self.bounds.size.width
                     viewHeight:self.bounds.size.height];
  __weak RCTRotatingView *weakSelf = self;
  [_motionManager startDeviceMotionUpdatesWithHandler:^(CGAffineTransform transform) {
    if (weakSelf == nil) { return; }
    weakSelf.transform = transform;
  }];
  
  
}

- (void) reset {
  self.transform = CGAffineTransformIdentity;
  if (_motionManager) {
    [_motionManager stopDeviceMotionUpdates];
    _motionManager = nil;
  }
}

@end
