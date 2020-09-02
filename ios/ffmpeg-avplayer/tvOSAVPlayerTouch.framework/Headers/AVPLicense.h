//
//  AVPLicense.h
//  AVPlayerTouch
//
//  Created by apple on 15/10/9.
//  Copyright © 2015年 apple. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AVPLicense : NSObject
+ (BOOL)register:(NSString *)licenseString;
@end

NS_ASSUME_NONNULL_END