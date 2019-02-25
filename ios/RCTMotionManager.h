//
//  RCTMotionManager.h
//  RCTVideo
//
//  Created by June Kim on 1/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

typedef void (^RCTMotionManagerUpdatesHandler)(CGAffineTransform transform);

NS_ASSUME_NONNULL_BEGIN

@interface RCTMotionManager : NSObject

- (instancetype)initWithVideoWidth:(double)videoWidth videoHeight:(double)videoHeight viewWidth:(double)viewWidth viewHeight:(double)viewHeight;
- (void) stopDeviceMotionUpdates;
- (void) startDeviceMotionUpdatesWithHandler:(RCTMotionManagerUpdatesHandler) handler;
- (CGAffineTransform) getZeroRotationTransform;

- (void)lock;
- (void)unLock;

@end

NS_ASSUME_NONNULL_END
