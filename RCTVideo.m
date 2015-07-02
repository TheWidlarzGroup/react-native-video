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
  BOOL _playerItemObserverSet;
  AVPlayerLayer *_playerLayer;
  NSURL *_videoURL;

  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  bool _pendingSeek;
  float _pendingSeekTime;
  float _lastSeekTime;

  /* For sending videoProgress events */
  Float64 _progressUpdateInterval;
  id _timeObserver;

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
    _resizeMode = @"AVLayerVideoGravityResizeAspectFill";
    _pendingSeek = false;
    _pendingSeekTime = 0.0f;
    _lastSeekTime = 0.0f;
    _progressUpdateInterval = 250;

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
    [_player pause];
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification
{
  [self applyModifiers];
}

#pragma mark - Progress

- (void)sendProgressUpdate
{
   AVPlayerItem *video = [_player currentItem];
   if (video == nil || video.status != AVPlayerItemStatusReadyToPlay) {
     return;
   }
    
   CMTime playerDuration = [self playerItemDuration];
   if (CMTIME_IS_INVALID(playerDuration)) {
      return;
   }

   CMTime currentTime = _player.currentTime;
   const Float64 duration = CMTimeGetSeconds(playerDuration);
   const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);
   if( currentTimeSecs >= 0 && currentTimeSecs <= duration) {
        [_eventDispatcher sendInputEventWithName:RNVideoEventProgress
                                            body:@{
                                                     @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(currentTime)],
                                                     @"playableDuration": [self calculatePlayableDuration],
                                                     @"atValue": [NSNumber numberWithLongLong:currentTime.value],
                                                     @"atTimescale": [NSNumber numberWithInt:currentTime.timescale],
                                                     @"target": self.reactTag
                                                 }];
   }
}

/*!
 *  Get the duration for a AVPlayerItem.
 */

- (CMTime)playerItemDuration
{
    AVPlayerItem *playerItem = [_player currentItem];
    if (playerItem.status == AVPlayerItemStatusReadyToPlay) {
        return([playerItem duration]);
    }
    return(kCMTimeInvalid);
}

/*!
 * Calculates and returns the playable duration of the current player item using its loaded time ranges.
 *
 * \returns The playable duration of the current player item in seconds.
 */
- (NSNumber *)calculatePlayableDuration {
  AVPlayerItem *video = _player.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    __block CMTimeRange effectiveTimeRange;
    [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      if (CMTimeRangeContainsTime(timeRange, video.currentTime)) {
        effectiveTimeRange = timeRange;
        *stop = YES;
      }
    }];
    Float64 playableDuration = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange));
    if (playableDuration > 0) {
      return [NSNumber numberWithFloat:playableDuration];
    }
  }
  return [NSNumber numberWithInteger:0];
}

- (void)addPlayerItemObserver
{
  [_playerItem addObserver:self forKeyPath:statusKeyPath options:0 context:nil];
  _playerItemObserverSet = YES;
}

/* Fixes https://github.com/brentvatne/react-native-video/issues/43
 * Crashes caused when trying to remove the observer when there is no
 * observer set */
- (void)removePlayerItemObserver
{
  if (_playerItemObserverSet) {
    [_playerItem removeObserver:self forKeyPath:statusKeyPath];
    _playerItemObserverSet = NO;
  }
}

#pragma mark - Player and source

- (void)setSrc:(NSDictionary *)source
{
  [self removePlayerTimeObserver];
  [self removePlayerItemObserver];
  _playerItem = [self playerItemForSource:source];
  [self addPlayerItemObserver];

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

    
  const Float64 progressUpdateIntervalMS = _progressUpdateInterval / 1000;
  // @see endScrubbing in AVPlayerDemoPlaybackViewController.m of https://developer.apple.com/library/ios/samplecode/AVPlayerDemo/Introduction/Intro.html
  __weak RCTVideo *weakSelf = self;
  _timeObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(progressUpdateIntervalMS, NSEC_PER_SEC)
                                                        queue:NULL
                                                   usingBlock:^(CMTime time) { [weakSelf sendProgressUpdate]; }
                   ];
    
  [_eventDispatcher sendInputEventWithName:RNVideoEventLoading body:@{
    @"src": @{
      @"uri": [source objectForKey:@"uri"],
      @"type": [source objectForKey:@"type"],
      @"isNetwork":[NSNumber numberWithBool:(bool)[source objectForKey:@"isNetwork"]]
    },
    @"target": self.reactTag
  }];
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
    if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
      float duration = CMTimeGetSeconds(_playerItem.asset.duration);

      if (isnan(duration)) {
        duration = 0.0;
      }

      [_eventDispatcher sendInputEventWithName:RNVideoEventLoaded body:@{
        @"duration": [NSNumber numberWithFloat:duration],
        @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
        @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
        @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
        @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
        @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
        @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
        @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
        @"target": self.reactTag
      }];

      [self attachListeners];
      [self applyModifiers];
    } else if(_playerItem.status == AVPlayerItemStatusFailed) {
      [_eventDispatcher sendInputEventWithName:RNVideoEventLoadingError body:@{
        @"error": @{
          @"code": [NSNumber numberWithInteger: _playerItem.error.code],
          @"domain": _playerItem.error.domain
        },
        @"target": self.reactTag
      }];
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

- (void)attachListeners
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // listen for end of file
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(playerItemDidReachEnd:)
                                                 name:AVPlayerItemDidPlayToEndTimeNotification
                                               object:[_player currentItem]];
  });
}

- (void)playerItemDidReachEnd:(NSNotification *)notification
{
  [_eventDispatcher sendInputEventWithName:RNVideoEventEnd body:@{
    @"target": self.reactTag
  }];
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
  dispatch_async(dispatch_get_main_queue(), ^{
    _playerLayer.videoGravity = mode;
  });
}

- (void)setPaused:(BOOL)paused
{
  if (paused) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [_player pause];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [_player play];
    });
  }

  _paused = paused;
}

- (void)setSeek:(float)seekTime
{
  int timeScale = 10000;

  AVPlayerItem *item = _player.currentItem;
  if (item && item.status == AVPlayerItemStatusReadyToPlay) {
    // TODO check loadedTimeRanges

    CMTime cmSeekTime = CMTimeMakeWithSeconds(seekTime, timeScale);
    CMTime current = item.currentTime;
    // TODO figure out a good tolerance level
    CMTime tolerance = CMTimeMake(1000, timeScale);

    if (CMTimeCompare(current, cmSeekTime) != 0) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
          [_eventDispatcher sendInputEventWithName:RNVideoEventSeek body:@{
            @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
            @"seekTime": [NSNumber numberWithFloat:seekTime],
            @"target": self.reactTag
          }];
        }];
      });

      _pendingSeek = false;
    }

  } else {
    // TODO see if this makes sense and if so,
    // actually implement it
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
    dispatch_async(dispatch_get_main_queue(), ^{
      [_player setVolume:0];
      [_player setMuted:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [_player setVolume:_volume];
      [_player setMuted:NO];
    });
  }

  [self setResizeMode:_resizeMode];
  [self setRepeat:_repeat];
  [self setPaused:_paused];
  dispatch_async(dispatch_get_main_queue(), ^{
    [_player setRate:_rate];
  });
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
  _playerLayer.frame = self.bounds;
}

#pragma mark - Lifecycle

/* Cancels the previously registered time observer. */
-(void)removePlayerTimeObserver
{
    if (_timeObserver)
    {
        [_player removeTimeObserver:_timeObserver];
        _timeObserver = nil;
    }
}

- (void)removeFromSuperview
{
  [self removePlayerTimeObserver];

  [_player pause];
  _player = nil;

  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;

  [self removePlayerItemObserver];

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [super removeFromSuperview];
}

@end
