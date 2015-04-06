#import "RCTVideo.h"
#import "RCTLog.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideo
{
    AVPlayer *_player;
    AVPlayerLayer *_playerLayer;
    NSURL *_videoURL;
    RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _eventDispatcher = eventDispatcher;
  }
  return self;
}

- (void)setSrc:(NSString *)source
{
  _videoURL = [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:source ofType:@"mp4"]];
  _player = [AVPlayer playerWithURL:_videoURL];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;
  _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
  _playerLayer.frame = self.bounds;
  _playerLayer.needsDisplayOnBoundsChange = YES;

  [self.layer addSublayer:_playerLayer];
  self.layer.needsDisplayOnBoundsChange = YES;

  AVPlayerItem *video = [_player currentItem];

  [_eventDispatcher sendInputEventWithName:@"videoLoaded" body:@{
    @"duration": [NSNumber numberWithFloat:CMTimeGetSeconds(video.asset.duration)],
    @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(video.currentTime)],
    @"canPlayReverse": [NSNumber numberWithBool:video.canPlayReverse],
    @"canPlayFastForward": [NSNumber numberWithBool:video.canPlayFastForward],
    @"canPlaySlowForward": [NSNumber numberWithBool:video.canPlaySlowForward],
    @"canPlaySlowReverse": [NSNumber numberWithBool:video.canPlaySlowReverse],
    @"canStepBackward": [NSNumber numberWithBool:video.canStepBackward],
    @"canStepForward": [NSNumber numberWithBool:video.canStepForward],
    @"target": self.reactTag
  }];
}

- (void)setResizeMode:(NSString*)mode
{
  _playerLayer.videoGravity = mode;
}

- (void)setPause:(BOOL)wantsToPause
{
    if (wantsToPause) {
        [_player pause];
    } else {
        [_player play];
    }
}


- (void)playerItemDidReachEnd:(NSNotification *)notification {
  AVPlayerItem *item = [notification object];
  [item seekToTime:kCMTimeZero];
  [_player play];
}


- (void)setRepeatEnabled {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playerItemDidReachEnd:)
                                               name:AVPlayerItemDidPlayToEndTimeNotification
                                             object:[_player currentItem]];
}

- (void) setRepeatDisabled {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setRepeat:(BOOL)repeat
{
  if (repeat) {
    [self setRepeatEnabled];
  } else {
    [self setRepeatDisabled];
  }
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  RCTLogError(@"video cannot have any subviews");
  return;
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTLogError(@"video cannot have any subviews");
  return;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _playerLayer.frame = self.bounds;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
