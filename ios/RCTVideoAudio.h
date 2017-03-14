//
//  RCTVideoAudio.h
//  RCTVideo
//
//  Created by Alex Jarvis on 14/03/2017.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@interface RCTVideoAudio : NSObject

+ (instancetype)sharedInstance;

- (void)addComponent;
- (void)removeComponent;

@end
