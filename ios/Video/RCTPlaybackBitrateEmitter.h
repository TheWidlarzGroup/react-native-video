//
//  playbackBitrateEmitter.h
//  labs2020mobile
//
//  Created by Farales, Ron on 11/4/22.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface playbackBitrateEmitter : RCTEventEmitter <RCTBridgeModule>

//@property (nonatomic, strong) playbackBitrateEmitter *sharedEmitter;
+ (void)emitBitrateEvent:(double)bitrate;

@end
