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

static double const kMaxLockAngle = -0.209;  // 12 degree, clockwise
static double const kMinLockAngle = -6.074;   // 12 degree, counter-clockwise

typedef enum {
  RCTMotionManagerStateLocked,    // Locked to certain angles
  RCTMotionManagerStateFree,      // Free to track device rotation
  RCTMotionManagerStateUnlocking  // During an unlock animation
} RCTMotionManagerState;

@implementation RCTMotionManager {
  CMMotionManager *_motionManager;
  OvalCalculator *_scaler;
  double _videoWidth;
  double _videoHeight;
  double _viewWidth;
  double _viewHeight;
  RCTMotionManagerState _lockState;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _motionManager = [CMMotionManager new];
    _motionManager.deviceMotionUpdateInterval = 1/60.0;
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

- (void)lock {
  _lockState = RCTMotionManagerStateLocked;
}

- (void)unLock {
  // TODO: go through RCTMotionManagerStateUnlocking first
  _lockState = RCTMotionManagerStateFree;
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
    
    double rawRotation = atan2(lastX, lastY) - M_PI;
    double rotation = [self.class rotationWithLockState:_lockState rawRotation:rawRotation];
//    printf("rawRotation: %.2f, rotation: %.2f\n", rawRotation, rotation);
    
    handler([self transformWithRotation:rotation]);
  }];
}

+ (double)rotationWithLockState:(RCTMotionManagerState)lockState rawRotation:(double)rawRotaton {
  static double midLockAngle = (kMinLockAngle + kMaxLockAngle) / 2.0;
  if (lockState == RCTMotionManagerStateLocked) {
    if (rawRotaton > kMinLockAngle && rawRotaton <= midLockAngle) {
      return kMinLockAngle;
    } else if (rawRotaton > midLockAngle && rawRotaton < kMaxLockAngle) {
      return kMaxLockAngle;
    }
  }
  return rawRotaton;
}

- (CGAffineTransform)getZeroRotationTransform {
  return [self transformWithRotation:0];
}

- (void)stopDeviceMotionUpdates {
  [_motionManager stopDeviceMotionUpdates];
}

@end
