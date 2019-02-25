//
//  RCTFramelessCounter.h
//  RCTVideo
//
//  Created by June Kim on 2/25/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTFramelessCounter : NSObject

- (void) resetCount;
- (void) record: (double) display_rotation_degree;
- (void) incrementBounce;
- (NSDictionary*) trackingProperties;

@end

NS_ASSUME_NONNULL_END
