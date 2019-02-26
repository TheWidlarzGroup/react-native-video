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

typedef enum {
  RCTMotionManagerStateFree,      // Free to track device rotation
  RCTMotionManagerStateLocked,    // May free move within 15 degrees, and bend within 20 degrees
  RCTMotionManagerStateBouncing,  // During a bouncing animation
  RCTMotionManagerStateUnlocking  // During an unlock animation
} RCTMotionManagerState;

@implementation RCTMotionManager {
  CMMotionManager *_motionManager;
  RCTMotionManagerUpdatesHandler _updatesHandler;
  OvalCalculator *_scaler;
  double _videoWidth;
  double _videoHeight;
  double _viewWidth;
  double _viewHeight;

  RCTMotionManagerState _lockState;
  CADisplayLink *_animatorSampler;
  CFTimeInterval _animationStartTime;
  double _initialRotationWhenUnlocking;
  double _rotationDeltaForUnlocking;
}

- (instancetype)initWithVideoWidth:(double)videoWidth videoHeight:(double)videoHeight viewWidth:(double)viewWidth viewHeight:(double)viewHeight {
  self = [super init];
  if (self) {
    _motionManager = [CMMotionManager new];
    _motionManager.deviceMotionUpdateInterval = 1/60.0;
    _scaler = [[OvalCalculator alloc] init];
    _videoWidth = videoWidth;
    _videoHeight = videoHeight;
    _viewWidth = viewWidth;
    _viewHeight = viewHeight;
  }
  return self;
}

- (CGAffineTransform)transformWithRotation:(CGFloat)rotation
                                translateX:(CGFloat)translateX {
  [_scaler set_fit];
  double scale =
  [_scaler get_scaleWithDouble:_viewWidth
                    withDouble:_viewHeight
                    withDouble:_videoWidth
                    withDouble:_videoHeight
                    withDouble:rotation];
  CGAffineTransform transform = CGAffineTransformMakeScale(scale, scale);
  transform = CGAffineTransformRotate(transform, rotation);
  return CGAffineTransformTranslate(transform, translateX, 0.0);
}

- (BOOL) isFlatWithGravity:(CMAcceleration) gravity {
  return fabs(gravity.x) < 0.2 && fabs(gravity.y) < 0.2;
}

- (void)startDeviceMotionUpdatesWithHandler:(RCTMotionManagerUpdatesHandler)handler {
  _updatesHandler = [handler copy];
  __block double lastX = -1;
  __block double lastY = -1;
  double minDecay = 0.15;
  __weak RCTMotionManager *weakSelf = self;
  [_motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion * _Nullable motion, NSError * _Nullable error) {

    __strong RCTMotionManager *strongSelf = weakSelf;
    if (strongSelf == nil) { return; }
    if (strongSelf->_lockState == RCTMotionManagerStateUnlocking
        || strongSelf->_lockState == RCTMotionManagerStateBouncing) {
      // An animation is going on, don't use sensor's input
      return;
    }
    if (motion == nil) { return; }

    CMAcceleration gravity = motion.gravity;
    if ([strongSelf isFlatWithGravity:gravity]) { return; }

    double decay = minDecay + fabs(gravity.x) * (1 - minDecay);

    lastX = gravity.x * decay + lastX * (1 - decay);
    lastY = gravity.y * decay + lastY * (1 - decay);

    double rawRotation = atan2(lastX, lastY) - M_PI;
    if (rawRotation < -3.142) {
      rawRotation = rawRotation + 6.283;
    }
    BOOL shouldBounce = NO;
    double translateX = 0.0;
    double rotation = [strongSelf.class rotationWithLockState:_lockState
                                                  rawRotation:rawRotation
                                                   translateX:&translateX
                                                 shouldBounce:&shouldBounce];
    _initialRotationWhenUnlocking = rotation;
    _rotationDeltaForUnlocking = rawRotation - rotation;
    //    printf("rawRotation: %.2f, rotation: %.2f\n", rawRotation, rotation);

    if (handler) {
      handler([strongSelf transformWithRotation:rotation
                                     translateX:translateX]);
    }
  }];
}

- (CGAffineTransform)getZeroRotationTransform {
  return [self transformWithRotation:0 translateX:0.0];
}

- (void)stopDeviceMotionUpdates {
  [_motionManager stopDeviceMotionUpdates];
}

#pragma mark - Time Lock

+ (double)rotationWithLockState:(RCTMotionManagerState)lockState
                    rawRotation:(double)rawRotation
                     translateX:(double *)translateX
                   shouldBounce:(BOOL *)shouldBounce {
  *shouldBounce = NO;
  *translateX = 0.0;

  if (lockState == RCTMotionManagerStateFree) {
    return rawRotation;
  }

  assert(lockState == RCTMotionManagerStateLocked);
  double const sign = (rawRotation >= 0.0) ? 1.0 : -1.0;
  rawRotation = rawRotation * sign;

  static double const kLockAngle = 0.262;       // 15 degrees
  static double const kBounceAngle = 0.349;  // 20 degrees
  static double const kMaxTranslateX = 24.0;    // In points

  if (rawRotation > kLockAngle && rawRotation <= kBounceAngle) {
    // Bending
    *translateX = -sign * kMaxTranslateX * (rawRotation - kLockAngle) / (kBounceAngle - kLockAngle);
    rawRotation = kLockAngle;
  } else if (rawRotation > kBounceAngle) {
    // Bouncing
    *translateX = -sign * kMaxTranslateX;
    rawRotation = kLockAngle;
    *shouldBounce = YES;
  }
  return rawRotation * sign;
}

- (void)lock {
  _lockState = RCTMotionManagerStateLocked;
}

- (void)unLock {
  _lockState = RCTMotionManagerStateUnlocking;

  _animationStartTime = CACurrentMediaTime();
  _animatorSampler = [CADisplayLink displayLinkWithTarget:self selector:@selector(sampleAnimator:)];
  [_animatorSampler addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  _animatorSampler.frameInterval = 1;
}

- (void)sampleAnimator:(CADisplayLink *)sampler {
  CFTimeInterval timeElapsed = CACurrentMediaTime() - _animationStartTime;
  double factor = [self springAnimationFactorWithTimeElapsed:timeElapsed];
  //  printf("sampleAnimator timeElapsed: %.2f, factor: %.2f\n", timeElapsed, factor);
  double rotation = _initialRotationWhenUnlocking + _rotationDeltaForUnlocking * factor;
  if (_updatesHandler) {
    _updatesHandler([self transformWithRotation:rotation translateX:0.0]);
  }

  if (timeElapsed > 1.4) {
    [sampler invalidate];
    _lockState = RCTMotionManagerStateFree;
  }
}

/*!
 iOS doesn't provide us an update block from UIView animation,
 we had to use a spring animation equation from
 https://medium.com/@dtinth/spring-animation-in-css-2039de6e1a03
 f(0) = 0; f'(0) = 0; f''(t) = -100(f(t) - 1) - 16f'(t)
 */
- (double)springAnimationFactorWithTimeElapsed:(CFTimeInterval)timeElapsed {
  double const coefficientTime = 6.0 * timeElapsed;
  double const exponential = exp2(-8.0*timeElapsed);
  return -4.0/3.0*exponential*sin(coefficientTime) - exponential*cos(coefficientTime) + 1.0;
}

@end
