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
  CADisplayLink *_animationTimer;
  CFTimeInterval _animationStartTime;
  double _initialRotationForAnimation;
  double _initialTranslateXForAnimation;
  double _rotationDeltaForAnimation;
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
  static double const kUnInitizedValue = -10;
  __block double lastX = kUnInitizedValue;
  __block double lastY = kUnInitizedValue;
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
    if (lastX == kUnInitizedValue) {
      lastX = gravity.x;
    }
    if (lastY == kUnInitizedValue) {
      lastY = gravity.y;
    }

    lastX = gravity.x * decay + lastX * (1 - decay);
    lastY = gravity.y * decay + lastY * (1 - decay);

    double const rawRotation = atan2(lastX, lastY) - M_PI;  // Within (-2*M_PI, 0]
    double normalizedRotation;
    if (rawRotation <= -M_PI) {
      normalizedRotation = rawRotation + 2 * M_PI;  // Within (0, M_PI]
    } else {
      normalizedRotation = rawRotation;             // Within (-M_PI, 0]
    }
    BOOL shouldBounce = NO;
    double translateX = 0.0;
    double rotation = [strongSelf.class rotationWithLockState:_lockState
                                           normalizedRotation:normalizedRotation
                                                   translateX:&translateX
                                                 shouldBounce:&shouldBounce];
    _initialRotationForAnimation = rotation;
    _rotationDeltaForAnimation = normalizedRotation - rotation;
    _initialTranslateXForAnimation = translateX;
    if (shouldBounce) {
      [strongSelf bounce];
      return;
    }

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
             normalizedRotation:(double)normalizedRotation
                     translateX:(double *)translateX
                   shouldBounce:(BOOL *)shouldBounce {
  *shouldBounce = NO;
  *translateX = 0.0;

  if (lockState == RCTMotionManagerStateFree) {
    return normalizedRotation;
  }

  assert(lockState == RCTMotionManagerStateLocked);
  double const sign = (normalizedRotation >= 0.0) ? 1.0 : -1.0;
  normalizedRotation = normalizedRotation * sign;

  static double const kLockAngle = 0.262;       // 15 degrees
  static double const kBounceAngle = 0.349;  // 20 degrees
  static double const kMaxTranslateX = 8.0;    // In points

  if (normalizedRotation > kLockAngle && normalizedRotation <= kBounceAngle) {
    // Bending
    *translateX = -sign * kMaxTranslateX * (normalizedRotation - kLockAngle) / (kBounceAngle - kLockAngle);
    normalizedRotation = kLockAngle;
  } else if (normalizedRotation > kBounceAngle) {
    // Bouncing
    *translateX = -sign * kMaxTranslateX;
    normalizedRotation = kLockAngle;
    *shouldBounce = YES;
  }
  return normalizedRotation * sign;
}

- (void)lock {
  _lockState = RCTMotionManagerStateLocked;
}

- (void)unLock {
  _lockState = RCTMotionManagerStateUnlocking;
  [self startAnimationTimer];
}

- (void)bounce {
  _lockState = RCTMotionManagerStateBouncing;
  [self startAnimationTimer];
}

- (void)startAnimationTimer {
  [_animationTimer invalidate];
  _animationStartTime = CACurrentMediaTime();
  _animationTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(timerFired:)];
  [_animationTimer addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  _animationTimer.frameInterval = 1;
}

- (void)timerFired:(CADisplayLink *)timer {
  CFTimeInterval timeElapsed = CACurrentMediaTime() - _animationStartTime;
  double rotation;
  double factor = 1.0;
  if (_lockState == RCTMotionManagerStateUnlocking) {
    factor = [self springAnimationFactorWithTimeElapsed:timeElapsed duration:0.7];
    rotation = _initialRotationForAnimation + _rotationDeltaForAnimation * factor;
  } else if (_lockState == RCTMotionManagerStateBouncing) {
    factor = [self springAnimationFactorWithTimeElapsed:timeElapsed duration:1.2];
    rotation = _initialRotationForAnimation;
  }
  double translateX = _initialTranslateXForAnimation * (1-factor);
  if (_updatesHandler) {
    _updatesHandler([self transformWithRotation:rotation translateX:translateX]);
  }

  if (factor >= 1.0) {
    [timer invalidate];
    if (_lockState == RCTMotionManagerStateUnlocking) {
      _lockState = RCTMotionManagerStateFree;
    } else if (_lockState == RCTMotionManagerStateBouncing) {
      _lockState = RCTMotionManagerStateLocked;
    }
  }
}

/*!
 iOS doesn't provide us an update block from UIView animation,
 we had to use a spring animation equation.
 */
- (double)springAnimationFactorWithTimeElapsed:(CFTimeInterval)timeElapsed
                                      duration:(CFTimeInterval)duration {
  // 2nd order equation
  // https://medium.com/@dtinth/spring-animation-in-css-2039de6e1a03
  // https://www.wolframalpha.com
  // f(0) = 0; f'(0) = 0; f''(t) = -100(f(t) - 1) - 16f'(t)
  //  double const coefficientTime = 6.0 * timeElapsed;
  //  double const exponential = exp2(-8.0*timeElapsed);
  //  return -4.0/3.0*exponential*sin(coefficientTime) - exponential*cos(coefficientTime) + 1.0;

  // f(0) = 0; f'(0) = 0; f''(t) = -100(f(t) - 1) - 25f'(t)
  //  return (exp2(-20.0*timeElapsed) - 4.0*exp2(-5.0*timeElapsed) + 3.0) / 3.0;

  // Sigmoid
  // https://hackernoon.com/ease-out-the-half-sigmoid-7240df433d98
  double const steepness = 5.0;
  double const result = [self sigmoidWithTime:timeElapsed steepness:steepness] / [self sigmoidWithTime:duration steepness:steepness];
  return MIN(result, 1.0);
}

// Use Sigmoid function to generate an ease-out animation curve
- (double)sigmoidWithTime:(double)time steepness:(double)steepness {
  return 1.0 / (1.0 + exp(-steepness * time)) - 0.5;
}

@end
