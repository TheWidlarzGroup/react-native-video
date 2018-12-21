//
//  Scaler.h
//  RCTVideo
//
//  Created by June Kim on 12/20/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface FWScaler : NSObject

- (float) getScaleWithViewWidth: (double) view_width viewHeight:(double) view_height videoWidth:(double) video_width videoHeight: (double) video_height rad: (double) rad raw: (BOOL) raw;

@end

NS_ASSUME_NONNULL_END
