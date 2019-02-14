//
//  RCTRotatingView.h
//  RCTVideo
//
//  Created by June Kim on 2/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRotatingView : UIView

@property CGFloat videoWidth;
@property CGFloat videoHeight;

- (void) startRotating;
- (void) reset;

@end

NS_ASSUME_NONNULL_END
