//
//  RCTFramelessCounter.m
//  RCTVideo
//
//  Created by June Kim on 2/25/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTFramelessCounter.h"

@interface RCTFramelessCounter ()

@property int bounceCount;
@property int rotationCount;
@property int maxDegree;

@end

@implementation RCTFramelessCounter {
  int _lastOrientation;
  int _orientationTh;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self resetCount];
  }
  return self;
}

- (void) resetCount {
  _bounceCount = 0;
  _rotationCount = 0;
  _maxDegree = 0;
  _lastOrientation = 0;
  _orientationTh = 15;
}

- (void) checkRotated: (double) degree {
  if ((360-_orientationTh < degree || degree < _orientationTh) && _lastOrientation != 0) {
    _lastOrientation = 0;
    _rotationCount ++;
  }
  else if (90-_orientationTh < degree && degree < 90+_orientationTh && _lastOrientation != 1) {
    _lastOrientation = 1;
    _rotationCount ++;
  }
  else if (180-_orientationTh < degree && degree < 180+_orientationTh && _lastOrientation != 2) {
    _lastOrientation = 2;
    _rotationCount ++;
  }
  else if (270-_orientationTh < degree && degree < 270+_orientationTh && _lastOrientation != 3) {
    _lastOrientation = 3;
    _rotationCount ++;
  }
}

- (void) record: (double) display_rotation_degree {
  double toMaxDegree = display_rotation_degree > 180 ? display_rotation_degree - 360 : display_rotation_degree;
  _maxDegree = fmax(_maxDegree, fabs(toMaxDegree));
  [self checkRotated: display_rotation_degree];
}

- (void) incrementBounce {
  _bounceCount ++;
}

- (NSDictionary*) trackingProperties {
  NSDictionary* properties = @{
                               @"max_degree" : [NSNumber numberWithInt:_maxDegree],
                               @"rotation_count" : [NSNumber numberWithInt:_rotationCount],
                               @"bounce_count" : [NSNumber numberWithInt:_bounceCount],
                               };
  return properties;
}

@end
