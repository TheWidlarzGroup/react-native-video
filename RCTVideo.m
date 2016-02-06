#import "RCTConvert.h"
#import "RCTVideo.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

static NSString *const statusKeyPath = @"status";
static NSString *const playbackLikelyToKeepUpKeyPath = @"playbackLikelyToKeepUp";

@implementation RCTVideo
{
  AVPlayer *_player;
  NSMutableArray *_clipAssets;
  AVPlayerItem *_playerItem;
  BOOL _playerItemObserversSet;
  AVPlayerLayer *_playerLayer;
  AVPlayerViewController *_playerViewController;
  NSURL *_videoURL;

  /* To buffer multiple videos (AVMutableComposition doesn't do this properly) */
  AVPlayer *_bufferingPlayer;
  AVPlayerItem *_bufferingPlayerItem;
  int _currentlyBufferingIndex;

  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  bool _pendingSeek;
  float _pendingSeekTime;
  float _lastSeekTime;

  /* For sending videoProgress events */
  Float64 _progressUpdateInterval;
  BOOL _controls;
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
    _controls = NO;

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

- (AVPlayerViewController*)createPlayerViewController:(AVPlayer*)player withPlayerItem:(AVPlayerItem*)playerItem {
    AVPlayerViewController* playerLayer= [[AVPlayerViewController alloc] init];
    playerLayer.view.frame = self.bounds;
    playerLayer.player = _player;
    playerLayer.view.frame = self.bounds;
    return playerLayer;
}

/* ---------------------------------------------------------
 **  Get the duration for a AVPlayerItem.
 ** ------------------------------------------------------- */

- (CMTime)playerItemDuration:(AVPlayer *)player
{
    AVPlayerItem *playerItem = [player currentItem];
    if (playerItem.status == AVPlayerItemStatusReadyToPlay)
    {
        return([playerItem duration]);
    }
    
    return(kCMTimeInvalid);
}


/* Cancels the previously registered time observer. */
-(void)removePlayerTimeObserver
{
    if (_timeObserver)
    {
        [_player removeTimeObserver:_timeObserver];
        _timeObserver = nil;
    }
}

#pragma mark - Progress

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App lifecycle handlers

- (void)applicationWillResignActive:(NSNotification *)notification
{
  if (!_paused) {
    [_player pause];
    [_player setRate:0.0];
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification
{
  [self applyModifiers];
}

#pragma mark - Progress

- (void)sendProgressUpdate
{

  [self updateBufferingProgress];

   AVPlayerItem *video = [_player currentItem];
   if (video == nil || video.status != AVPlayerItemStatusReadyToPlay) {
     return;
   }
    
   CMTime playerDuration = [self playerItemDuration :_player];
   if (CMTIME_IS_INVALID(playerDuration)) {
      return;
   }

   CMTime currentTime = _player.currentTime;
   const Float64 duration = CMTimeGetSeconds(playerDuration);
   const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);
   if( currentTimeSecs >= 0 && currentTimeSecs <= duration) {
        [_eventDispatcher sendInputEventWithName:@"onVideoProgress"
                                            body:@{
                                                     @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(currentTime)],
                                                @"playableDuration": [self calculatePlayableDuration :_player],
                                                     @"atValue": [NSNumber numberWithLongLong:currentTime.value],
                                                     @"atTimescale": [NSNumber numberWithInt:currentTime.timescale],
                                                     @"target": self.reactTag
                                                 }];
   }
}

/*!
 * Calculates and returns the playable duration of the current player item using its loaded time ranges.
 *
 * \returns The playable duration of the current player item in seconds.
 */
- (NSNumber *)calculatePlayableDuration:(AVPlayer *)player
{
  AVPlayerItem *video = player.currentItem;
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

- (void)addPlayerItemObservers
{
  [_playerItem addObserver:self forKeyPath:statusKeyPath options:0 context:nil];
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
    [_playerItem removeObserver:self forKeyPath:playbackLikelyToKeepUpKeyPath];
    _playerItemObserversSet = NO;
  }
}

#pragma mark - Player and source

- (void)setSrc:(NSArray *)source
{
  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];

  _clipAssets = [self assetsForSources:source];
  _playerItem = [self playerItemForAssets:_clipAssets];

  [self startBufferingClips];

  [self addPlayerItemObservers];

  [_player pause];
  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;
  [_playerViewController.view removeFromSuperview];
  _playerViewController = nil;

  _player = [AVPlayer playerWithPlayerItem:_playerItem];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;

  // @see endScrubbing in AVPlayerDemoPlaybackViewController.m of https://developer.apple.com/library/ios/samplecode/AVPlayerDemo/Introduction/Intro.html
  const Float64 progressUpdateIntervalMS = _progressUpdateInterval / 1000;
  __weak RCTVideo *weakSelf = self;
  _timeObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(progressUpdateIntervalMS, NSEC_PER_SEC)
                                                        queue:NULL
                                                   usingBlock:^(CMTime time) { [weakSelf sendProgressUpdate]; }
                   ];

  // Note: Currently doesn't handle heterogeneous clips.
  NSDictionary *firstSource = source[0];
  [_eventDispatcher sendInputEventWithName:@"onVideoLoadStart"
                                      body:@{@"src": @{
                                                 @"uri": [firstSource objectForKey:@"uri"],
                                                 @"type": [firstSource objectForKey:@"type"],
                                                 @"isNetwork":[NSNumber numberWithBool:(bool)[firstSource objectForKey:@"isNetwork"]]},
                                             @"target": self.reactTag}];
}

- (NSMutableArray*)assetsForSources:(NSArray *)sources
{
  NSMutableArray *assets = [[NSMutableArray alloc] init];
  for (NSDictionary* source in sources) {
    bool isNetwork = [RCTConvert BOOL:[source objectForKey:@"isNetwork"]];
    bool isAsset = [RCTConvert BOOL:[source objectForKey:@"isAsset"]];
    NSString *uri = [source objectForKey:@"uri"];
    NSString *type = [source objectForKey:@"type"];

    NSURL *url = (isNetwork || isAsset) ?
      [NSURL URLWithString:uri] :
      [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:uri ofType:type]];

    [assets addObject:[AVURLAsset URLAssetWithURL:url options:nil]];
  }
  return assets;
}

- (AVPlayerItem*)playerItemForAssets:(NSMutableArray *)assets
{
  AVMutableComposition* composition = [AVMutableComposition composition];
  for (AVAsset* asset in assets) {
    CMTimeRange editRange = CMTimeRangeMake(CMTimeMake(0, 600), asset.duration);
    NSError *editError;

    [composition insertTimeRange:editRange
                         ofAsset:asset
                          atTime:composition.duration
                           error:&editError];
  }
  AVPlayerItem* playerItem = [AVPlayerItem playerItemWithAsset:composition];
  return playerItem;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (object == _playerItem) {

    if ([keyPath isEqualToString:statusKeyPath]) {
      // Handle player item status change.
      if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
        float duration = CMTimeGetSeconds(_playerItem.asset.duration);

        if (isnan(duration)) {
          duration = 0.0;
        }

        [_eventDispatcher sendInputEventWithName:@"onVideoLoad"
                                            body:@{@"duration": [NSNumber numberWithFloat:duration],
                                                   @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
                                                   @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
                                                   @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
                                                   @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
                                                   @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
                                                   @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
                                                   @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
                                                   @"target": self.reactTag}];

        [self attachListeners];
        [self applyModifiers];
      } else if(_playerItem.status == AVPlayerItemStatusFailed) {
        [_eventDispatcher sendInputEventWithName:@"onVideoError"
                                            body:@{@"error": @{
                                                       @"code": [NSNumber numberWithInteger: _playerItem.error.code],
                                                       @"domain": _playerItem.error.domain},
                                                   @"target": self.reactTag}];
      }
    } else if ([keyPath isEqualToString:playbackLikelyToKeepUpKeyPath]) {
      // Continue playing (or not if paused) after being paused due to hitting an unbuffered zone.
      if (_playerItem.playbackLikelyToKeepUp) {
        [self setPaused:_paused];
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
  [_eventDispatcher sendInputEventWithName:@"onVideoEnd" body:@{@"target": self.reactTag}];

  if (_repeat) {
    AVPlayerItem *item = [notification object];
    [item seekToTime:kCMTimeZero];
    [self applyModifiers];
  }
}

#pragma mark - Buffering

- (void)startBufferingClips
{
  _bufferingPlayerItem = [AVPlayerItem playerItemWithAsset:_clipAssets[0]];
  _bufferingPlayer = [AVPlayer playerWithPlayerItem:_bufferingPlayerItem];
  _currentlyBufferingIndex = 0;
}

- (void)updateBufferingProgress
{
  // If the playable (loaded) range is within 100 milliseconds of the clip
  // currently being buffered, load the next clip into the buffering player.
  float playableDuration = [[self calculatePlayableDuration :_bufferingPlayer] floatValue];
  CMTime totalDurationTime = [self playerItemDuration :_bufferingPlayer];
  Float64 totalDurationSeconds = CMTimeGetSeconds(totalDurationTime);
  bool bufferingComplete = totalDurationSeconds - playableDuration < 0.1;
  if (bufferingComplete && _currentlyBufferingIndex < [_clipAssets count] - 1) {
    _currentlyBufferingIndex += 1;
    _bufferingPlayerItem = [AVPlayerItem playerItemWithAsset:_clipAssets[_currentlyBufferingIndex]];
    _bufferingPlayer = [AVPlayer playerWithPlayerItem:_bufferingPlayerItem];
  }
}

#pragma mark - Prop setters

- (void)setResizeMode:(NSString*)mode
{
  if( _controls )
  {
    _playerViewController.videoGravity = mode;
  }
  else
  {
    _playerLayer.videoGravity = mode;
  }
  _resizeMode = mode;
}

- (void)setPaused:(BOOL)paused
{
  if (paused) {
    [_player pause];
    [_player setRate:0.0];
  } else {
    [_player play];
    [_player setRate:_rate];
  }
  
  _paused = paused;
}

- (float)getCurrentTime
{
  return _playerItem != NULL ? CMTimeGetSeconds(_playerItem.currentTime) : 0;
}

- (void)setCurrentTime:(float)currentTime
{
  [self setSeek: currentTime];
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
      [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
        [_eventDispatcher sendInputEventWithName:@"onVideoSeek"
                                            body:@{@"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                                                   @"seekTime": [NSNumber numberWithFloat:seekTime],
                                                   @"target": self.reactTag}];
      }];

      _pendingSeek = false;
    }

  } else {
    // TODO: See if this makes sense and if so, actually implement it
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
  [self setControls:_controls];
}

- (void)setRepeat:(BOOL)repeat {
  _repeat = repeat;
}

- (void)usePlayerViewController
{
    if( _player )
    {
        _playerViewController = [self createPlayerViewController:_player withPlayerItem:_playerItem];
        [self addSubview:_playerViewController.view];
    }
}

- (void)usePlayerLayer
{
    if( _player )
    {
      _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
      _playerLayer.frame = self.bounds;
      _playerLayer.needsDisplayOnBoundsChange = YES;
    
      [self.layer addSublayer:_playerLayer];
      self.layer.needsDisplayOnBoundsChange = YES;
    }
}

- (void)setControls:(BOOL)controls
{
    if( _controls != controls || (!_playerLayer && !_playerViewController) )
    {
        _controls = controls;
        if( _controls )
        {
            [_playerLayer removeFromSuperlayer];
            _playerLayer = nil;
            [self usePlayerViewController];
        }
        else
        {
            [_playerViewController.view removeFromSuperview];
            _playerViewController = nil;
            [self usePlayerLayer];
        }
    }
}

#pragma mark - React View Management

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // We are early in the game and somebody wants to set a subview.
  // That can only be in the context of playerViewController.
  if( !_controls && !_playerLayer && !_playerViewController )
  {
    [self setControls:true];
  }
  
  if( _controls )
  {
     view.frame = self.bounds;
     [_playerViewController.contentOverlayView insertSubview:view atIndex:atIndex];
  }
  else
  {
     RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)removeReactSubview:(UIView *)subview
{
  if( _controls )
  {
      [subview removeFromSuperview];
  }
  else
  {
    RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if( _controls )
  {
    _playerViewController.view.frame = self.bounds;
  
    // also adjust all subviews of contentOverlayView
    for (UIView* subview in _playerViewController.contentOverlayView.subviews) {
      subview.frame = self.bounds;
    }
  }
  else
  {
      [CATransaction begin];
      [CATransaction setAnimationDuration:0];
      _playerLayer.frame = self.bounds;
      [CATransaction commit];
  }
}

#pragma mark - Lifecycle

- (void)removeFromSuperview
{
  [_player pause];
  _player = nil;
  _bufferingPlayer = nil;

  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;
  
  [_playerViewController.view removeFromSuperview];
  _playerViewController = nil;

  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [super removeFromSuperview];
}

@end
