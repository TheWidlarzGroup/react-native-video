//
//  RCTVideoView.m
//  
//
//  Created by Tibor Hencz on 23/09/15.
//
//

#import "RCTVideoView.h"
#import "RCTVideo.h"
#import "RCTVideoManager.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideoView
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
    [super setBackgroundColor:[UIColor redColor]];
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
    [_playerLayer removeFromSuperlayer];
    _playerLayer = (AVPlayerLayer*)self.layer;
    [_playerLayer setPlayer:player];
    _playerLayer.frame = self.bounds;
    _playerLayer.needsDisplayOnBoundsChange = YES;
    player.actionAtItemEnd = AVPlayerActionAtItemEndNone;
    _playerLayer.backgroundColor = [[UIColor greenColor] CGColor];
    self.layer.needsDisplayOnBoundsChange = YES;
}

-(void)setPlayerUuid:(NSString*)playerUuid
{
    RCTVideo* player = [RCTVideoManager getPlayer:playerUuid];
    AVPlayer* avPlayer = [player getAVPlayer];
    [self setPlayer:avPlayer];
}

+(Class)layerClass
{
    return [AVPlayerLayer class];
}

@end
