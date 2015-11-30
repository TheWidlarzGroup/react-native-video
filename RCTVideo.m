#import "RCTConvert.h"
#import "RCTVideo.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import <AVFoundation/AVFoundation.h>

static NSString *const statusKeyPath = @"status";
static NSString *const loadedTimeRangesKeyPath = @"loadedTimeRanges";
static NSString *const playbackBufferEmptyKeyPath = @"playbackBufferEmpty";
static NSString *const playbackLikelyToKeepUpKeyPath = @"playbackLikelyToKeepUp";

@implementation RCTVideo
{
  AVPlayer *_player;
  AVPlayerItem *_playerItem;
  BOOL _playerItemObserversSet;
  AVPlayerLayer *_playerLayer;
  NSURL *_videoURL;
  BOOL _videoEnded;

  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  BOOL _isBufferEmpty;
  NSArray *_loadedTimeRanges;

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
  BOOL _paused;
  BOOL _repeat;
  NSString * _resizeMode;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _eventDispatcher = eventDispatcher;

    _rate = 1.0;
    _volume = 1.0;
    _resizeMode = AVLayerVideoGravityResizeAspectFill;
    _isBufferEmpty = YES;
    _pendingSeek = false;
    _pendingSeekTime = 0.0f;
    _lastSeekTime = 0.0f;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationWillResignActive:)
                                                 name:UIApplicationWillResignActiveNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationWillEnterForeground:)
                                                 name:UIApplicationWillEnterForegroundNotification
                                               object:nil];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App lifecycle handlers

- (void)applicationWillResignActive:(NSNotification *)notification
{
  if (!_paused) {
    [self stopProgressTimer];
    [_player setRate:0.0];
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification
{
  [self startProgressTimer];
  [self applyModifiers];
}

#pragma mark - Progress

- (void)sendProgressUpdate
{
  AVPlayerItem *video = [_player currentItem];
  if (video == nil || _videoEnded || video.status != AVPlayerItemStatusReadyToPlay) {
    return;
  }

  if (_prevProgressUpdateTime == nil || (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
    [_eventDispatcher sendInputEventWithName:@"onVideoProgress"
                                        body:@{@"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(video.currentTime)],
                                               @"target": self.reactTag}];
    _prevProgressUpdateTime = [NSDate date];
  }
}

- (float)getDuration:(AVPlayerItem *)video
{
  float duration = CMTimeGetSeconds(video.asset.duration);
  if (isnan(duration)) {
    duration = 0.0;
  }
  return duration;
}

- (NSArray *)getLoadedTimeRanges
{
  AVPlayerItem *video = _player.currentItem;
  NSMutableArray *ranges = [NSMutableArray new];
  [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    CMTimeRange range = [obj CMTimeRangeValue];
    [ranges addObject:@{
      @"start": [NSNumber numberWithFloat:CMTimeGetSeconds(range.start)],
      @"duration": [NSNumber numberWithFloat:CMTimeGetSeconds(range.duration)]
    }];
  }];
  return [ranges copy];
}

- (BOOL)isTimeBuffered:(CMTime)time
{
  // Nothing is buffered yet.
  if (_isBufferEmpty) {
    return NO;
  }

  __block BOOL isBuffered = NO;

  AVPlayerItem *video = [_player currentItem];
  [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    CMTimeRange range = [obj CMTimeRangeValue];
    if (CMTimeRangeContainsTime(range, time)) {
      isBuffered = YES;
      *stop = YES;
    }
  }];

  return isBuffered;
}

- (void)stopProgressTimer
{
  [_progressUpdateTimer invalidate];
}

- (void)startProgressTimer
{
  _progressUpdateInterval = 250;
  _prevProgressUpdateTime = nil;

  [self stopProgressTimer];

  _progressUpdateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(sendProgressUpdate)];
  [_progressUpdateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
}

- (void)addPlayerItemObservers
{
  [_playerItem addObserver:self forKeyPath:statusKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:loadedTimeRangesKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:playbackBufferEmptyKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:playbackLikelyToKeepUpKeyPath options:0 context:nil];
  _playerItemObserversSet = YES;
}

/* Fixes https://github.com/brentvatne/react-native-video/issues/43
 * Crashes caused when trying to remove the observer when there is no
 * observer set */
- (void)removePlayerItemObservers
{
  if (_playerItemObserversSet) {
    [_playerItem removeObserver:self forKeyPath:statusKeyPath];
    [_playerItem removeObserver:self forKeyPath:loadedTimeRangesKeyPath];
    [_playerItem removeObserver:self forKeyPath:playbackBufferEmptyKeyPath];
    [_playerItem removeObserver:self forKeyPath:playbackLikelyToKeepUpKeyPath];
    _playerItemObserversSet = NO;
  }
}

#pragma mark - Player and source

- (void)setSrc:(NSDictionary *)source
{
  [self removePlayerItemObservers];
  _playerItem = [self playerItemForSource:source];
  [self addPlayerItemObservers];

  [_player pause];
  [_playerLayer removeFromSuperlayer];

  _player = [AVPlayer playerWithPlayerItem:_playerItem];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;

  _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
  _playerLayer.frame = self.bounds;
  _playerLayer.needsDisplayOnBoundsChange = YES;

  [self applyModifiers];

  [self.layer addSublayer:_playerLayer];
  self.layer.needsDisplayOnBoundsChange = YES;

  [_eventDispatcher sendInputEventWithName:@"onVideoLoadStart"
                                      body:@{@"src": @{
                                                 @"uri": [source objectForKey:@"uri"],
                                                 @"type": [source objectForKey:@"type"],
                                                 @"isNetwork":[NSNumber numberWithBool:(bool)[source objectForKey:@"isNetwork"]]},
                                             @"target": self.reactTag}];
}

- (AVPlayerItem*)playerItemForSource:(NSDictionary *)source
{
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

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (object == _playerItem) {

    // Handle player item status change.
    if ([keyPath isEqualToString:statusKeyPath]) {

      if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
        [_eventDispatcher sendInputEventWithName:@"onVideoLoad"
                                            body:@{@"duration": [NSNumber numberWithFloat:[self getDuration:_playerItem]],
                                                   @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
                                                   @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
                                                   @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
                                                   @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
                                                   @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
                                                   @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
                                                   @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
                                                   @"target": self.reactTag}];

        if (_pendingSeek) {
          _pendingSeek = false;
          [self setSeek:_pendingSeekTime];
        }

        [self startProgressTimer];
        [self attachListeners];
        [self applyModifiers];

      } else if (_playerItem.status == AVPlayerItemStatusFailed) {
        [_eventDispatcher sendInputEventWithName:@"onVideoError"
                                            body:@{@"error": @{
                                                       @"code": [NSNumber numberWithInteger: _playerItem.error.code],
                                                       @"domain": _playerItem.error.domain},
                                                   @"target": self.reactTag}];
      }

    } else if ([keyPath isEqualToString:loadedTimeRangesKeyPath]) {

      // Prevent 'onVideoBuffer' events while seeking or finished.
      if (_pendingSeek || _videoEnded) {
        return;
      }

      // Prevent duplicate 'onVideoBuffer' events.
      NSArray *loadedTimeRanges = [self getLoadedTimeRanges];
      if (_loadedTimeRanges && [_loadedTimeRanges isEqualToArray:loadedTimeRanges]) {
        return;
      }

      _loadedTimeRanges = loadedTimeRanges;
      [_eventDispatcher sendInputEventWithName:@"onVideoBuffer"
                                          body:@{@"ranges": _loadedTimeRanges,
                                                 @"target": self.reactTag}];

    } else if ([keyPath isEqualToString:playbackLikelyToKeepUpKeyPath]) {

      // Prevent duplicate 'onVideoBufferReady' events.
      BOOL isBufferReady = _playerItem.playbackLikelyToKeepUp;
      if (_isBufferEmpty && isBufferReady) {
        _isBufferEmpty = NO;
        [_eventDispatcher sendInputEventWithName:@"onVideoBufferReady"
                                            body:@{@"target": self.reactTag}];
        [self setPaused:_paused];
      }

    } else if ([keyPath isEqualToString:playbackBufferEmptyKeyPath]) {

      // Prevent duplicate 'onVideoBufferEmpty' events.
      BOOL isBufferEmpty = _playerItem.playbackBufferEmpty;
      if (!_isBufferEmpty && isBufferEmpty) {
        _isBufferEmpty = YES;
        [_eventDispatcher sendInputEventWithName:@"onVideoBufferEmpty"
                                            body:@{@"target": self.reactTag}];
      }
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

- (void)attachListeners
{
  // listen for end of file
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playerItemDidReachEnd:)
                                               name:AVPlayerItemDidPlayToEndTimeNotification
                                             object:[_player currentItem]];
}

- (void)playerItemDidReachEnd:(NSNotification *)notification
{
  _videoEnded = YES;
  NSNumber *currentTime = [NSNumber numberWithFloat:[self getDuration:[_player currentItem]]];
  [_eventDispatcher sendInputEventWithName:@"onVideoProgress"
                                      body:@{@"currentTime": currentTime,
                                             @"target": self.reactTag}];
  [_eventDispatcher sendInputEventWithName:@"onVideoEnd" body:@{@"target": self.reactTag}];

  if (_repeat) {
    AVPlayerItem *item = [notification object];
    [item seekToTime:kCMTimeZero];
    [self applyModifiers];
  }
}

#pragma mark - Prop setters

- (void)setResizeMode:(NSString*)mode
{
  _resizeMode = mode;
  _playerLayer.videoGravity = mode;
}

- (void)setPaused:(BOOL)paused
{
  if (paused) {
    [self stopProgressTimer];
    [_player setRate:0.0];
  } else {
    [self startProgressTimer];
    [_player setRate:_rate];
  }

  _paused = paused;
}

- (void)setSeek:(float)seekTime
{
  int timeScale = 10000;

  AVPlayerItem *item = _player.currentItem;
  if (item && item.status == AVPlayerItemStatusReadyToPlay) {

    float maxSeekTime = [self getDuration:item] - 0.1;
    if (seekTime >= maxSeekTime) {
      seekTime = maxSeekTime;
    }

    // TODO figure out a good tolerance level
    CMTime tolerance = CMTimeMake(1000, timeScale);
    CMTime cmSeekTime = CMTimeMakeWithSeconds(seekTime, timeScale);
    if (CMTimeCompare(item.currentTime, cmSeekTime) == 0) {
      return;
    }

    // Seeking to an unbuffered time should dispatch an 'onVideoBufferEmpty' event.
    if (!_isBufferEmpty && ![self isTimeBuffered:cmSeekTime]) {
      _isBufferEmpty = YES;
      [_eventDispatcher sendInputEventWithName:@"onVideoBufferEmpty"
                                          body:@{@"target": self.reactTag}];
    }

    // Prevent 'onVideoProgress' events while seeking.
    _videoEnded = YES;

    [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {

      // The 'seekTime' is always less than the video duration.
      _videoEnded = NO;

      [_eventDispatcher sendInputEventWithName:@"onVideoSeek"
                                          body:@{@"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                                                 @"target": self.reactTag}];
    }];
  } else {
    _pendingSeek = true;
    _pendingSeekTime = seekTime;
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

- (void)setVolume:(float)volume
{
  _volume = volume;
  [self applyModifiers];
}

- (void)applyModifiers
{
  if (_muted) {
    [_player setVolume:0];
    [_player setMuted:YES];
  } else {
    [_player setVolume:_volume];
    [_player setMuted:NO];
  }

  [self setResizeMode:_resizeMode];
  [self setRepeat:_repeat];
  [self setPaused:_paused];
}

- (void)setRepeat:(BOOL)repeat {
  _repeat = repeat;
}

#pragma mark - React View Management

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
  [CATransaction begin];
  [CATransaction setAnimationDuration:0];
  _playerLayer.frame = self.bounds;
  [CATransaction commit];
}

#pragma mark - Lifecycle

- (void)removeFromSuperview
{
  [_progressUpdateTimer invalidate];
  _prevProgressUpdateTime = nil;

  [_player pause];
  _player = nil;

  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;

  [self removePlayerItemObservers];

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [super removeFromSuperview];
}

@end
