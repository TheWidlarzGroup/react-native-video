#import "RCTConvert.h"
#import "RCTVideo.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import <AVFoundation/AVFoundation.h>

NSString *const RNVideoEventLoaded = @"videoLoaded";
NSString *const RNVideoEventLoading = @"videoLoading";
NSString *const RNVideoEventProgress = @"videoProgress";
NSString *const RNVideoEventSeek = @"videoSeek";
NSString *const RNVideoEventLoadingError = @"videoLoadError";
NSString *const RNVideoEventEnd = @"videoEnd";

static NSString *const statusKeyPath = @"status";

@implementation RCTVideo
{
  AVPlayer *_player;
  AVPlayerItem *_playerItem;
  AVPlayerLayer *_playerLayer;
  NSURL *_videoURL;

  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  bool _pendingSeek;
  float _pendingSeekTime;
  float _lastSeekTime;

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
    _rate = 1.0;
    _volume = 1.0;

    _pendingSeek = false;
    _pendingSeekTime = 0.0f;
    _lastSeekTime = 0.0f;
  }
  return self;
}

#pragma mark - Progress

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

- (void)stopProgressTimer {
  [_progressUpdateTimer invalidate];
}

- (void)startProgressTimer {
  _progressUpdateInterval = 250;
  _prevProgressUpdateTime = nil;

  [self stopProgressTimer];

  _progressUpdateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(sendProgressUpdate)];
  [_progressUpdateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
}

- (void)notifyEnd: (NSNotification *)notification {
    [_eventDispatcher sendInputEventWithName:RNVideoEventEnd body:@{
        @"target": self.reactTag
    }];
}

#pragma mark - Player and source

- (void)setSrc:(NSDictionary *)source {
  [_playerItem removeObserver:self forKeyPath:statusKeyPath];
  _playerItem = [self playerItemForSource:source];
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

  [_eventDispatcher sendInputEventWithName:RNVideoEventLoading body:@{
    @"src": @{
      @"uri": [source objectForKey:@"uri"],
      @"type": [source objectForKey:@"type"],
      @"isNetwork":[NSNumber numberWithBool:(bool)[source objectForKey:@"isNetwork"]]
    },
    @"target": self.reactTag
  }];
}

- (AVPlayerItem*)playerItemForSource:(NSDictionary *)source {
  bool isNetwork = [RCTConvert BOOL:[source objectForKey:@"isNetwork"]];
  bool isAsset = [RCTConvert BOOL:[source objectForKey:@"isAsset"]];
  NSString *uri = [source objectForKey:@"uri"];
  NSString *type = [source objectForKey:@"type"];

  NSURL *url = (isNetwork || isAsset) ?
    [NSURL URLWithString:uri] :
    [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:uri ofType:type]];

  if (isAsset) {
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    return [AVPlayerItem playerItemWithAsset:asset];
  }

  return [AVPlayerItem playerItemWithURL:url];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
  if (object == _playerItem) {
    if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
      // NSLog(@"duration: %f",CMTimeGetSeconds(_playerItem.asset.duration));
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

      [self startProgressTimer];
      [self attachListeners];
      [_player play];
      [self applyModifiers];
    } else if(_playerItem.status == AVPlayerItemStatusFailed) {
      [_eventDispatcher sendInputEventWithName:RNVideoEventLoadingError body:@{
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

- (void)attachListeners {

    // listen for end of file
    [[NSNotificationCenter defaultCenter] addObserver:self
        selector:@selector(notifyEnd:)
        name:AVPlayerItemDidPlayToEndTimeNotification
        object:[_player currentItem]];

}

- (void)playerItemDidReachEnd:(NSNotification *)notification {
    AVPlayerItem *item = [notification object];
    [item seekToTime:kCMTimeZero];
    [_player play];
    [self applyModifiers];
}

#pragma mark - Prop setters

- (void)setResizeMode:(NSString*)mode {
  _playerLayer.videoGravity = mode;
}

- (void)setPaused:(BOOL)paused {
  if (paused) {
    [self stopProgressTimer];
    [_player pause];
  } else {
    [self startProgressTimer];
    [_player play];

  }
}

- (void)setSeek:(float)seekTime {
  int timeScale = 10000;

  AVPlayerItem *item = _player.currentItem;
  if (item && item.status == AVPlayerItemStatusReadyToPlay) {
    // TODO check loadedTimeRanges

    CMTime cmSeekTime = CMTimeMakeWithSeconds(seekTime, timeScale);
    CMTime current = item.currentTime;
    // TODO figure out a good tolerance level
    CMTime tolerance = CMTimeMake(1000, timeScale);

    if (CMTimeCompare(current, cmSeekTime) != 0) {
      [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
        [_eventDispatcher sendInputEventWithName:RNVideoEventSeek body:@{
          @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
          @"seekTime": [NSNumber numberWithFloat:seekTime],
          @"target": self.reactTag
        }];
      }];
      
      _pendingSeek = false;
    }

  } else {
    // TODO see if this makes sense and if so,
    // actually implement it
    _pendingSeek = true;
    _pendingSeekTime = seekTime;
  }
}

- (void)setRate:(float)rate {
  _rate = rate;
  [self applyModifiers];
}

- (void)setMuted:(BOOL)muted {
  _muted = muted;
  [self applyModifiers];
}

- (void)setVolume:(float)volume {
  _volume = volume;
  [self applyModifiers];
}

- (void)applyModifiers {
  /* volume must be set to 0 if muted is YES, or the video freezes playback */
  if (_muted) {
    [_player setVolume:0];
    [_player setMuted:YES];
  } else {
    [_player setVolume:_volume];
    [_player setMuted:NO];
  }

  [_player setRate:_rate];
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

#pragma mark - React View Management

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

#pragma mark - Lifecycle

- (void)removeFromSuperview {
  [_progressUpdateTimer invalidate];
  _prevProgressUpdateTime = nil;

  [_player pause];
  _player = nil;

  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;

  [_playerItem removeObserver:self forKeyPath:statusKeyPath];

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
