//
//  RCTMotionManager.h
//  RCTVideo
//
//  Created by June Kim on 1/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTMotionManager : NSObject

- (void) stopDeviceMotionUpdates;
- (void) setVideoWidth: (double) videoWidth videoHeight: (double) videoHeight viewWidth: (double) viewWidth viewHeight: (double) viewHeight;
- (void) startDeviceMotionUpdatesWithHandler:(void(^)(CGAffineTransform transform)) handler;
- (CGAffineTransform) getZeroRotationTransform;

@end

NS_ASSUME_NONNULL_END
