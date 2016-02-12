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
  int _playingClipIndex;
  NSMutableArray *_clipAssets;
  NSMutableArray *_clipEndOffsets;
  AVPlayerItem *_playerItem;
  BOOL _playerItemObserversSet;
  AVPlayerLayer *_playerLayer;
  AVPlayerViewController *_playerViewController;
  NSURL *_videoURL;

  /* To buffer multiple videos (AVMutableComposition doesn't do this properly).
   * See the comments below the Buffering pragma mark for more details. */
  NSTimer *_bufferingObserver;
  AVPlayer *_bufferingPlayerA;
  AVPlayer *_bufferingPlayerB;
  AVPlayerItem *_bufferingPlayerItemA;
  AVPlayerItem *_bufferingPlayerItemB;
  NSNumber *_currentlyBufferingIndexA;
  NSNumber *_currentlyBufferingIndexB;
  NSNumber *_nextIndexToBuffer;
  NSMutableArray *_bufferedClipIndexes;

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

/* Cancels the previously registered buffering progress observer */
-(void)removeBufferingObserver
{
  if (_bufferingObserver) {
    [_bufferingObserver invalidate];
    _bufferingObserver = nil;
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
                                                @"playableDuration": [self calculatePlayableDuration],
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
- (NSNumber *)calculatePlayableDuration
{
  AVPlayerItem *video = _player.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    __block CMTimeRange effectiveTimeRange;
    [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      /* NSLog(@"loadedTimeRanges for main item: idx %i, seconds %f", idx, CMTimeGetSeconds(CMTimeRangeGetEnd(timeRange))); */
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
  [self removeBufferingObserver];

  [self prepareAssetsForSources:source];
  _playerItem = [self playerItemForAssets:_clipAssets];

  if ([_clipAssets count] > 0) {
    [self startBufferingClips];
  }

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

  _bufferingObserver = [NSTimer scheduledTimerWithTimeInterval:(_progressUpdateInterval / 1000)
                                                        target:weakSelf
                                                      selector:@selector(updateBufferingProgress)
                                                      userInfo:nil
                                                       repeats:true];

  // Note: Currently doesn't handle heterogeneous clips.
  if ([source count] > 0) {
    NSDictionary *firstSource = source[0];
    [_eventDispatcher sendInputEventWithName:@"onVideoLoadStart"
                                        body:@{@"src": @{
                                                   @"uri": [firstSource objectForKey:@"uri"],
                                                   @"type": [firstSource objectForKey:@"type"],
                                                   @"isNetwork":[NSNumber numberWithBool:(bool)[firstSource objectForKey:@"isNetwork"]]},
                                               @"target": self.reactTag}];
  }
}

- (void)prepareAssetsForSources:(NSArray *)sources
{
  NSMutableArray *assets = [[NSMutableArray alloc] init];
  NSMutableArray *offsets = [[NSMutableArray alloc] init];
  _bufferedClipIndexes = [[NSMutableArray alloc] init];
  CMTime currentOffset = kCMTimeZero;
  for (NSDictionary* source in sources) {
    [_bufferedClipIndexes addObject:[NSNumber numberWithInt:0]];
    bool isNetwork = [RCTConvert BOOL:[source objectForKey:@"isNetwork"]];
    bool isAsset = [RCTConvert BOOL:[source objectForKey:@"isAsset"]];
    NSString *uri = [source objectForKey:@"uri"];
    NSString *type = [source objectForKey:@"type"];

    NSURL *url = (isNetwork || isAsset) ?
      [NSURL URLWithString:uri] :
      [[NSURL alloc] initFileURLWithPath:[[NSBundle mainBundle] pathForResource:uri ofType:type]];

    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    currentOffset = CMTimeAdd(currentOffset, asset.duration);

    NSArray *videoTracks = [asset tracksWithMediaType:AVMediaTypeVideo];
    NSArray *audioTracks = [asset tracksWithMediaType:AVMediaTypeAudio];

    if ([videoTracks count] > 0 && [audioTracks count] > 0) {
      [assets addObject:asset];
      [offsets addObject:[NSNumber numberWithFloat:CMTimeGetSeconds(currentOffset)]];
    } else {
      NSLog(@"RCTVideo: WARNING - missing audio or video track for asset %@ (uri: %@), skipping...", asset, uri);
    }
  }
  _clipAssets = assets;
  _clipEndOffsets = offsets;
}

- (AVPlayerItem*)playerItemForAssets:(NSMutableArray *)assets
{
  AVMutableComposition* composition = [AVMutableComposition composition];
  AVMutableCompositionTrack *compVideoTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo
                                                                   preferredTrackID:kCMPersistentTrackID_Invalid];
  AVMutableCompositionTrack *compAudioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio
                                                                   preferredTrackID:kCMPersistentTrackID_Invalid];
  CMTime timeOffset = kCMTimeZero;
  for (AVAsset* asset in assets) {
    CMTimeRange editRange = CMTimeRangeMake(CMTimeMake(0, 600), asset.duration);
    NSError *editError;

    NSArray *videoTracks = [asset tracksWithMediaType:AVMediaTypeVideo];
    NSArray *audioTracks = [asset tracksWithMediaType:AVMediaTypeAudio];

    if ([videoTracks count] > 0) {
    AVAssetTrack *videoTrack = [videoTracks objectAtIndex:0];
      [compVideoTrack insertTimeRange:editRange
                              ofTrack:videoTrack
                               atTime:timeOffset
                                error:&editError];
    }

    if ([audioTracks count] > 0) {
      AVAssetTrack *audioTrack = [audioTracks objectAtIndex:0];
      [compAudioTrack insertTimeRange:editRange
                              ofTrack:audioTrack
                               atTime:timeOffset
                                error:&editError];
    }

    if ([videoTracks count] > 0 && [audioTracks count] > 0) {
      timeOffset = CMTimeAdd(timeOffset, asset.duration);
    }
  }
  AVPlayerItem* playerItem = [AVPlayerItem playerItemWithAsset:composition];
  return playerItem;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (object == _playerItem) {

    AVPlayerItem *item = object;

    if ([keyPath isEqualToString:statusKeyPath]) {
      // Handle player item status change.
      if (item.status == AVPlayerItemStatusReadyToPlay) {
        float duration = CMTimeGetSeconds(item.asset.duration);

        if (isnan(duration)) {
          duration = 0.0;
        }

        [_eventDispatcher sendInputEventWithName:@"onVideoLoad"
                                            body:@{@"duration": [NSNumber numberWithFloat:duration],
                                                   @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                                                   @"canPlayReverse": [NSNumber numberWithBool:item.canPlayReverse],
                                                   @"canPlayFastForward": [NSNumber numberWithBool:item.canPlayFastForward],
                                                   @"canPlaySlowForward": [NSNumber numberWithBool:item.canPlaySlowForward],
                                                   @"canPlaySlowReverse": [NSNumber numberWithBool:item.canPlaySlowReverse],
                                                   @"canStepBackward": [NSNumber numberWithBool:item.canStepBackward],
                                                   @"canStepForward": [NSNumber numberWithBool:item.canStepForward],
                                                   @"target": self.reactTag}];

        [self attachListeners];
        [self applyModifiers];
      } else if(item.status == AVPlayerItemStatusFailed) {
        [_eventDispatcher sendInputEventWithName:@"onVideoError"
                                            body:@{@"error": @{
                                                       @"code": [NSNumber numberWithInteger: item.error.code],
                                                       @"domain": item.error.domain},
                                                   @"target": self.reactTag}];
      }
    } else if ([keyPath isEqualToString:playbackLikelyToKeepUpKeyPath]) {
      // Continue playing (or not if paused) after being paused due to hitting an unbuffered zone.
      if (item.playbackLikelyToKeepUp) {
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

/* AVMutableComposition has several desirable properties for multiple-video playback:
 * It allows continuous scrubbing between clips, presenting the composite video's
 * duration as the sum of the component clips' duration.
 * 
 * However, when this code was written (Feb '16), an AVPlayer loaded with an AVPlayerItem
 * whose asset was a AVMutableComposition buffered the video assets very slowly, and its
 * buffering progress was not correctly reflected in loadedTimeRanges or
 * playbackLikelyToKeepUp (the former was set to the full duration from the start, and
 * the latter was always true, despite very choppy playback during buffering).
 * 
 * To address this, two (or one, for clip lists of length <= 2) additional AVPlayers
 * are maintained. They buffer the assets much faster and more reliably than the _player,
 * since it's loaded with an AVMutableComposition.
 *
 * The logic below and associated bookkeeping variables track the buffering progress for
 * the buffering players via loadedTimeRanges, proceeding to load the lowest-indexed
 * clip that's not yet been buffered, stopping playback when it reaches a clip that's
 * currently being buffered.
 * */

- (void)startBufferingClips
{
  _bufferingPlayerItemA = [AVPlayerItem playerItemWithAsset:_clipAssets[0] 
                               automaticallyLoadedAssetKeys:@[@"tracks"]];
  _bufferingPlayerA = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemA];
  _currentlyBufferingIndexA = [NSNumber numberWithInt:0];
  if ([_clipAssets count] > 1) {
    _bufferingPlayerItemB = [AVPlayerItem playerItemWithAsset:_clipAssets[1] 
                                 automaticallyLoadedAssetKeys:@[@"tracks"]];
    _bufferingPlayerB = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemB];
    _currentlyBufferingIndexB = [NSNumber numberWithInt:1];
    _nextIndexToBuffer = [NSNumber numberWithInt:2];
  } else {
    _nextIndexToBuffer = [NSNumber numberWithInt:1];
  }
}

- (void)updateBufferingProgress
{
  [self updateBufferingProgressForPlayer :_bufferingPlayerA];
  if ([_clipAssets count] > 2) {
    [self updateBufferingProgressForPlayer :_bufferingPlayerB];
  }
}

- (void)updateBufferingProgressForPlayer:(AVPlayer*)bufferingPlayer
{
  Float64 playableDurationForBufferingItem = [self bufferedDurationForItem :bufferingPlayer];
  Float64 bufferingItemDuration = CMTimeGetSeconds([self playerItemDuration :bufferingPlayer]);

  // This margin is to cover the case where the audio channel has a slightly
  // shorter duration than the video channel.
  bool bufferingComplete = 0.95 * (bufferingItemDuration - playableDurationForBufferingItem) < 0.2;

  float playerTimeSeconds = CMTimeGetSeconds([_player currentTime]);
  __block NSUInteger playingClipIndex = 0;

  // find the index of _player's currently playing clip
  [_clipEndOffsets enumerateObjectsUsingBlock:^(id offset, NSUInteger idx, BOOL *stop) {
    if (playerTimeSeconds < [offset floatValue]) {
      playingClipIndex = idx;
      *stop = YES;
    }
  }];

  NSUInteger currentlyBufferingIndex = [(bufferingPlayer == _bufferingPlayerA ? _currentlyBufferingIndexA : _currentlyBufferingIndexB) intValue];

  const int MAX_IDX = 99999;
  __block int firstUnbufferedIdx = MAX_IDX;
  NSNumber *zero = [NSNumber numberWithInt:0];
  [_bufferedClipIndexes enumerateObjectsUsingBlock:^(id buffered, NSUInteger idx, BOOL *stop) {
    if ([buffered isEqualToNumber:zero]) {
      firstUnbufferedIdx = idx;
      *stop = YES;
    }
  }];

  float margin;
  if (firstUnbufferedIdx == MAX_IDX) {
    // All clips have been buffered
    [self setPaused :false];
    margin = 1000.0;
  } else {
    float bufferedOffset = firstUnbufferedIdx == 0 ? 0.0 : [_clipEndOffsets[firstUnbufferedIdx] floatValue];
    float totalBufferedSeconds = bufferedOffset + playableDurationForBufferingItem;

    margin = totalBufferedSeconds - playerTimeSeconds - 4.0;
    if (totalBufferedSeconds < playerTimeSeconds + 4.0) {
      [self setPaused :true];
    } else {
      [self setPaused :false];
    }
  }

  if (bufferingComplete) {
    [_bufferedClipIndexes replaceObjectAtIndex:currentlyBufferingIndex withObject:@(YES)];
  }

  if (bufferingComplete && [_nextIndexToBuffer intValue] < [_clipAssets count]) {
    if (bufferingPlayer == _bufferingPlayerA) {
      _currentlyBufferingIndexA = [_nextIndexToBuffer copy];
      _bufferingPlayerItemA = [AVPlayerItem playerItemWithAsset:_clipAssets[[_currentlyBufferingIndexA intValue]]
                                  automaticallyLoadedAssetKeys:@[@"tracks"]];
      
      _bufferingPlayerA = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemA];
    } else {
      _currentlyBufferingIndexB = [_nextIndexToBuffer copy];
      _bufferingPlayerItemB = [AVPlayerItem playerItemWithAsset:_clipAssets[[_currentlyBufferingIndexB intValue]]
                                  automaticallyLoadedAssetKeys:@[@"tracks"]];
      
      _bufferingPlayerB = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemB];
    }
    _nextIndexToBuffer = [NSNumber numberWithInt:([_nextIndexToBuffer intValue] + 1)];
  }
}

- (Float64)bufferedDurationForItem:(AVPlayer*)bufferingPlayer
{
  AVPlayerItem *video = bufferingPlayer.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    __block Float64 longestPlayableRangeSeconds;
    [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      Float64 seconds = CMTimeGetSeconds(CMTimeRangeGetEnd(timeRange));
      if (seconds && seconds > 0.1) {
        if (!longestPlayableRangeSeconds) {
          longestPlayableRangeSeconds = seconds;
        } else if (seconds > longestPlayableRangeSeconds) {
          longestPlayableRangeSeconds = seconds;
        }
      }
    }];
    if (longestPlayableRangeSeconds && longestPlayableRangeSeconds > 0) {
      return longestPlayableRangeSeconds;
    }
  }
  return 0.0;
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
  _bufferingPlayerA = nil;
  _bufferingPlayerB = nil;

  [_playerLayer removeFromSuperlayer];
  _playerLayer = nil;
  
  [_playerViewController.view removeFromSuperview];
  _playerViewController = nil;

  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];
  [self removeBufferingObserver];

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [super removeFromSuperview];
}

@end
