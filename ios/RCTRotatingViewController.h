//
//  RCTRotatingViewController.h
//  RCTVideo
//
//  Created by June Kim on 2/14/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRotatingViewController : UIViewController

@property BOOL frameless;
@property CGFloat videoWidth;
@property CGFloat videoHeight;


- (void) startRotatingIfNeeded;
- (void) reset;

@end

NS_ASSUME_NONNULL_END
