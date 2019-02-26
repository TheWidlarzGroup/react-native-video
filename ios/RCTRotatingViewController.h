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

@property (nonatomic, assign) BOOL frameless;
@property (nonatomic, assign) BOOL isLocked;
@property (nonatomic, assign) CGFloat videoWidth;
@property (nonatomic, assign) CGFloat videoHeight;

- (void) startRotatingIfNeeded;
- (void) reset;
- (NSDictionary*) framelessProperties;

@end

NS_ASSUME_NONNULL_END
