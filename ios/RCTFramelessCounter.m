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
@property int videoId;

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
  _orientationTh = 0;
}

- (void) checkRotated: (double) degree {
  if (-_orientationTh < degree && degree < _orientationTh && _lastOrientation != 0) {
    _lastOrientation = 0;
    _rotationCount ++;
  }
  else if (90-_orientationTh < degree && degree < 90+_orientationTh && _lastOrientation != 1) {
    _lastOrientation = 1;
    _rotationCount ++;
  }
  else if (180-_orientationTh < degree && degree < -180+_orientationTh && _lastOrientation != 2) {
    _lastOrientation = 2;
    _rotationCount ++;
  }
  else if (-90-_orientationTh < degree && degree < -90+_orientationTh && _lastOrientation != 3) {
    _lastOrientation = 3;
    _rotationCount ++;
  }
}

- (void) record: (double) display_rotation_degree {
  _maxDegree = fmax(_maxDegree, fabs(display_rotation_degree));
  [self checkRotated: display_rotation_degree];
}

- (void) incrementBounce {
  _bounceCount ++;
}

- (NSDictionary*) trackingProperties {
  NSDictionary* properties = @{
                               @"Video_id" : [NSNumber numberWithInt:_videoId],
                               @"Maximum Degree" : [NSNumber numberWithInt:_maxDegree],
                               @"Flipped_Count" : [NSNumber numberWithInt:_rotationCount],
                               @"Bounced_Count" : [NSNumber numberWithInt:_bounceCount],
                               };
  [self resetCount];
  return properties;
}

@end
