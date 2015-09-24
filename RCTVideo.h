#import "RCTView.h"
#import <AVFoundation/AVFoundation.h>

@class RCTEventDispatcher;

@interface RCTVideo : NSObject

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@property(nonatomic, copy)NSString* uuid;
-(void)setSrc:(NSDictionary*)source;
-(void)setPaused:(BOOL)paused;
-(void)setSeek:(float)seekTime;
-(void)setRate:(float)rate;
-(void)setMuted:(BOOL)muted;
-(void)setVolume:(float)volume;
-(void)applyModifiers;
-(void)setRepeat:(BOOL)repeat;
-(AVPlayer*)getAVPlayer;
@end
