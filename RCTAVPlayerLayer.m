#import "RCTAVPlayerLayer.h"
#import "RCTAVPlayer.h"
#import "RCTAVPlayerManager.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTAVPlayerLayer
{
    NSString* _resizeMode;
    AVPlayerLayer* _playerLayer;
}


-(instancetype)init
{
    if (self = [super init])
    {
        _resizeMode = @"AVLayerVideoGravityResizeAspectFill";
    }
    return self;
}


- (void)layoutSubviews
{
    [super layoutSubviews];
    [CATransaction begin];
    [CATransaction setAnimationDuration:0];
    _playerLayer.frame = self.bounds;
    [CATransaction commit];
}

-(void)setBackgroundColor:(UIColor *)backgroundColor
{
    
}

-(void)setResizeMode:(NSString*)mode
{
    _resizeMode = mode;
    _playerLayer.videoGravity = mode;
}

-(void)removeFromSuperview
{
    [_playerLayer removeFromSuperlayer];
    _playerLayer = nil;
    [super removeFromSuperview];
}

-(void)setPlayer:(AVPlayer*)player
{
    if (player != nil) {
        //[_playerLayer removeFromSuperlayer];
        _playerLayer = (AVPlayerLayer*)self.layer;
        [_playerLayer setPlayer:player];
        _playerLayer.frame = self.bounds;
        _playerLayer.needsDisplayOnBoundsChange = YES;
        _playerLayer.videoGravity = _resizeMode;
        self.layer.needsDisplayOnBoundsChange = YES;
    } else {
        [_playerLayer setPlayer:nil];
    }
}

-(void)setPlayerUuid:(NSString*)playerUuid
{
    RCTAVPlayer* player = [RCTAVPlayerManager getPlayer:playerUuid];
    AVPlayer* avPlayer = [player getAVPlayer];
    [self setPlayer:avPlayer];
}

+(Class)layerClass
{
    return [AVPlayerLayer class];
}

@end
