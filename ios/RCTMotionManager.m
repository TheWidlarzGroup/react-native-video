//
//  RCTMotionManager.m
//  RCTVideo
//
//  Created by June Kim on 1/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTMotionManager.h"
#include <CoreMotion/CoreMotion.h>
#import <math.h>
#import "OvalCalculator.h"


@implementation RCTMotionManager {
  CMMotionManager *_motionManager;
  OvalCalculator *_scaler;
  double _videoWidth;
  double _videoHeight;
  double _viewWidth;
  double _viewHeight;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _motionManager = [CMMotionManager new];
    _motionManager.deviceMotionUpdateInterval = 1/60;
    _scaler = [[OvalCalculator alloc] init];
  }
  return self;
}

-(void)setVideoWidth:(double)videoWidth videoHeight:(double)videoHeight viewWidth:(double)viewWidth viewHeight:(double)viewHeight {
  _videoWidth = videoWidth;
  _videoHeight = videoHeight;
  _viewWidth = viewWidth;
  _viewHeight = viewHeight;
}

- (CGAffineTransform) transformWithRotation: (CGFloat) rotation {
  [_scaler set_fit];
  double scale =
  [_scaler get_scaleWithDouble:_viewWidth
                    withDouble:_viewHeight
                    withDouble:_videoWidth
                    withDouble:_videoHeight
                    withDouble:rotation];
  CGAffineTransform transform = CGAffineTransformMakeScale(scale, scale);
  return CGAffineTransformRotate(transform, rotation);
}

- (BOOL) isFlatWithGravity:(CMAcceleration) gravity {
  return fabs(gravity.x) < 0.2 && fabs(gravity.y) < 0.2;
}


- (void)startDeviceMotionUpdatesWithHandler:(void (^)(CGAffineTransform))handler {
  __block double lastX = -1;
  __block double lastY = -1;
  double minDecay = 0.15;
  [_motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion * _Nullable motion, NSError * _Nullable error) {
    if (self == nil) { return; }
    if (motion == nil) { return ;}
    CMAcceleration gravity = motion.gravity;
    if ([self isFlatWithGravity:gravity]) { return; }
    
    double decay = minDecay + fabs(gravity.x) * (1 - minDecay);

    lastX = gravity.x * decay + lastX * (1 - decay);
    lastY = gravity.y * decay + lastY * (1 - decay);
    
    double rotation = atan2(lastX, lastY) - M_PI;
    
    handler([self transformWithRotation:rotation]);
  }];
  

}

- (CGAffineTransform)getZeroRotationTransform {
  return [self transformWithRotation:0];
}

- (void)stopDeviceMotionUpdates {
  [_motionManager stopDeviceMotionUpdates];
}

@end
