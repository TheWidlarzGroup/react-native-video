#import "RCTVideo.h"
#import "RCTLog.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import <AVFoundation/AVFoundation.h>

NSString *const RNVideoEventLoaded = @"videoLoaded";
NSString *const RNVideoEventLoading = @"videoLoading";
NSString *const RNVideoEventProgress = @"videoProgress";
NSString *const RNVideoEventLoadingError = @"videoLoadError";

static NSString *const statusKeyPath = @"status";

@implementation RCTVideo
{
  AVPlayer *_player;
  AVPlayerItem *_playerItem;
  AVPlayerLayer *_playerLayer;
  NSURL *_videoURL;

  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  /* For sending videoProgress events */
  id _progressUpdateTimer;
  int _progressUpdateInterval;
  NSDate *_prevProgressUpdateTime;

  /* Keep track of any modifiers, need to be applied after each play */
  float _volume;
  float _rate;
  BOOL _muted;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher {
  if ((self = [super init])) {
    _eventDispatcher = eventDispatcher;

    /* Initialize videoProgress status publisher */
    _progressUpdateInterval = 250;
    _prevProgressUpdateTime = nil;
    _progressUpdateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(sendProgressUpdate)];
    [_progressUpdateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
  }
  return self;
}

- (void)sendProgressUpdate {
   AVPlayerItem *video = [_player currentItem];
   if (video == nil || video.status != AVPlayerItemStatusReadyToPlay) {
     return;
   }

  if (_prevProgressUpdateTime == nil ||
     (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
    [_eventDispatcher sendInputEventWithName:RNVideoEventProgress body:@{
      @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(video.currentTime)],
      @"target": self.reactTag
    }];
    _prevProgressUpdateTime = [NSDate date];
  }
}

- (void)setSrc:(NSDictionary *)source {
  bool isNetwork = [source objectForKey:@"isNetwork"];
  NSString *uri = [source objectForKey:@"uri"];
  NSString *type = [source objectForKey:@"type"];

  _videoURL = isNetwork ?
    [NSURL URLWithString:uri] :
    [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:uri ofType:type]];

  [_playerItem removeObserver:self forKeyPath:statusKeyPath];
  _playerItem = [AVPlayerItem playerItemWithURL:_videoURL];
  [_playerItem addObserver:self forKeyPath:statusKeyPath options:0 context:nil];

  [_player pause];
  [_playerLayer removeFromSuperlayer];

  _player = [AVPlayer playerWithPlayerItem:_playerItem];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;

  _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
  _playerLayer.frame = self.bounds;
  _playerLayer.needsDisplayOnBoundsChange = YES;

  [self.layer addSublayer:_playerLayer];
  self.layer.needsDisplayOnBoundsChange = YES;

  [_eventDispatcher sendInputEventWithName:RNVideoEventLoadingError body:@{
    @"src": @{
      @"uri":uri,
      @"type": type,
      @"isNetwork":[NSNumber numberWithBool:isNetwork]
    },
    @"target": self.reactTag
  }];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
  if (object == _playerItem) {
    if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
      [_eventDispatcher sendInputEventWithName:RNVideoEventLoaded body:@{
        @"duration": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.duration)],
        @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
        @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
        @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
        @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
        @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
        @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
        @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
        @"target": self.reactTag
      }];

      [_player play];
      [self applyModifiers];
    } else if(_playerItem.status == AVPlayerItemStatusFailed) {
      [_eventDispatcher sendInputEventWithName:RNVideoLoadingErrorEvent body:@{
        @"error": @{
          @"code": [NSNumber numberWithInt:_playerItem.error.code],
          @"domain": _playerItem.error.domain
        },
        @"target": self.reactTag
      }];
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

- (void)setResizeMode:(NSString*)mode {
  _playerLayer.videoGravity = mode;
}

- (void)setPaused:(BOOL)paused
{
  if (paused) {
    [_player pause];
  } else {
    [_player play];
  }
}

- (void)setRate:(float)rate
{
  _rate = rate;
  [self applyModifiers];
}

- (void)setMuted:(BOOL)muted
{
  _muted = muted;
  [self applyModifiers];
}

- (void)setVolume:(float)volume {
  _volume = volume;
  [self applyModifiers];
}

- (void)applyModifiers
{
  /* volume must be set to 0 if muted is YES, or the video seems to
   * freeze */
  if (_muted) {
    [_player setVolume:0];
    [_player setMuted:YES];
  } else {
    [_player setVolume:_volume];
    [_player setMuted:NO];
  }

  [_player setRate:_rate];
}

- (void)playerItemDidReachEnd:(NSNotification *)notification {
  AVPlayerItem *item = [notification object];
  [item seekToTime:kCMTimeZero];
  [_player play];
  [self applyModifiers];
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

- (void)setRepeat:(BOOL)repeat {
  if (repeat) {
    [self setRepeatEnabled];
  } else {
    [self setRepeatDisabled];
  }
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex {
  RCTLogError(@"video cannot have any subviews");
  return;
}

- (void)removeReactSubview:(UIView *)subview {
  RCTLogError(@"video cannot have any subviews");
  return;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _playerLayer.frame = self.bounds;
}

- (void)removeFromSuperview
{
  [_player pause];
  [_progressUpdateTimer invalidate];
  [_playerLayer removeFromSuperlayer];
  _player = nil;
  _prevProgressUpdateTime = nil;
  _eventDispatcher = nil;
  [_playerItem removeObserver:self forKeyPath:statusKeyPath];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
