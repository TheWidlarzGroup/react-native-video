#import "RCTVideo.h"
#import "RCTLog.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTVideo
{
    AVPlayer *_player;
    AVPlayerLayer *_playerLayer;
}

- (id)init
{
  if ((self = [super init])) {

  }
  return self;
}

- (void)setSrc:(NSString *)source
{
  NSURL *videoURL = [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:source ofType:@"mp4"]];
  _player = [AVPlayer playerWithURL:videoURL];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;
  _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
  _playerLayer.frame = self.bounds;
  _playerLayer.needsDisplayOnBoundsChange = YES;
  [self.layer addSublayer:_playerLayer];
  self.layer.needsDisplayOnBoundsChange = YES;
  [_player play];
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
