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
  NSMutableArray *_clipDurations;
  AVPlayerItem *_playerItem;
  BOOL _playerItemObserversSet;
  AVPlayerLayer *_playerLayer;
  AVPlayerViewController *_playerViewController;
  NSURL *_videoURL;
  dispatch_queue_t _queue;


  /* This is used to prevent the async initialization of the player from proceeding
   * when removeFromSuperview has already been called. Under certain circumstances,
   * this caused audio playback to continue in the background after the view was
   * unmounted. */
  BOOL _removed;

  /* To buffer multiple videos (AVMutableComposition doesn't do this properly).
   * See the comments below the Buffering pragma mark for more details. */
  BOOL _bufferingStarted;
  NSTimer *_bufferingTimer;
  AVPlayer *_bufferingPlayerA;
  AVPlayer *_bufferingPlayerB;
  AVPlayer *_mainBufferingPlayer;
  AVPlayerItem *_bufferingPlayerItemA;
  AVPlayerItem *_bufferingPlayerItemB;
  NSNumber *_currentlyBufferingIndexA;
  NSNumber *_currentlyBufferingIndexB;
  NSNumber *_nextIndexToBuffer;
  NSMutableArray *_bufferedClipIndexes;
  BOOL _pausedForBuffering;

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
  BOOL _shouldBuffer;
  NSString * _resizeMode;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _eventDispatcher = eventDispatcher;

    _rate = 1.0;
    _volume = 1.0;
    _bufferingStarted = NO;
    _resizeMode = @"AVLayerVideoGravityResizeAspectFill";
    _pendingSeek = false;
    _pendingSeekTime = 0.0f;
    _lastSeekTime = 0.0f;
    _progressUpdateInterval = 250;
    _controls = NO;
    _pausedForBuffering = NO;
    _removed = NO;

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
-(void)removebufferingTimer
{
  if (_bufferingTimer) {
    [_bufferingTimer invalidate];
    _bufferingTimer = nil;
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

   int newPlayingClipIndex = [self playingClipIndex];
   if (_playingClipIndex < newPlayingClipIndex) {
     [_eventDispatcher sendInputEventWithName:@"onVideoClipEnd"
                                      body:@{
                                               @"playingClipIndex": [NSNumber numberWithInt:newPlayingClipIndex],
                                               @"target": self.reactTag
                                           }];
   }
   _playingClipIndex = newPlayingClipIndex;

   CMTime currentTime = _player.currentTime;
   const Float64 duration = CMTimeGetSeconds(playerDuration);
   const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);
   if(currentTimeSecs >= 0 && currentTimeSecs <= duration) {
      [_eventDispatcher sendInputEventWithName:@"onVideoProgress"
                                          body:@{
                                                   @"currentTime": [NSNumber numberWithFloat:currentTimeSecs],
                                                   @"currentTimeWithinPlayingClip": [self currentTimeWithinPlayingClip:currentTimeSecs],
                                                   @"playableDuration": [self calculatePlayableDuration],
                                                   @"atValue": [NSNumber numberWithLongLong:currentTime.value],
                                                   @"atTimescale": [NSNumber numberWithInt:currentTime.timescale],
                                                   @"playingClipIndex": [NSNumber numberWithInt:_playingClipIndex],
                                                   @"target": self.reactTag
                                               }];
   }
}

- (NSNumber*)currentTimeWithinPlayingClip:(float)currentTime
{
  float time;
  int playingClipIndex = [self playingClipIndex];
  if (playingClipIndex > 0) {
    time = currentTime - [_clipEndOffsets[playingClipIndex - 1] floatValue];
  } else {
    time = currentTime;
  }
  return [NSNumber numberWithFloat:time];
}

/*!
 * Calculates and returns the index of the clip being played by _player.
 *
 * \returns The index of the clip currently being played.
 */
- (int)playingClipIndex
{
  AVPlayerItem *video = _player.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    float playerTimeSeconds = CMTimeGetSeconds([_player currentTime]);
    __block NSUInteger playingClipIndex = 0;

    [_clipEndOffsets enumerateObjectsUsingBlock:^(id offset, NSUInteger idx, BOOL *stop) {
      if (playerTimeSeconds < [offset floatValue]) {
        playingClipIndex = idx;
        *stop = YES;
      }
    }];
    return playingClipIndex;
  }
  return 0;
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
  [self removebufferingTimer];
   _queue = dispatch_queue_create(nil, nil);

  __weak RCTVideo *weakSelf = self;
  const Float64 progressUpdateIntervalMS = _progressUpdateInterval / 1000;


  // This heavy lifting is done asynchronously to avoid burdening the UI thread.
  dispatch_async(_queue, ^{
    [self prepareAssetsForSources:source];
    _playerItem = [self playerItemForAssets:_clipAssets];
    _playingClipIndex = 0;

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

    if ([_clipAssets count] > 0) {
      // @see endScrubbing in AVPlayerDemoPlaybackViewController.m of https://developer.apple.com/library/ios/samplecode/AVPlayerDemo/Introduction/Intro.html
      if (_removed == YES) {
        /* In case the view was removed while this async block was setting things up,
         * we trigger the lifecycle cleanup logic, e.g. to prevent the player from
         * playing on in the background afer the view is unmounted.  */
        [self removeFromSuperview];
      } else {
        _timeObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(progressUpdateIntervalMS, NSEC_PER_SEC)
                                                              queue:NULL
                                                         usingBlock:^(CMTime time) { [weakSelf sendProgressUpdate]; }
                         ];


        dispatch_async(dispatch_get_main_queue(), ^{
          _bufferingTimer = [NSTimer scheduledTimerWithTimeInterval:(_progressUpdateInterval / 1000)
                                                                target:weakSelf
                                                              selector:@selector(updateBufferingProgress)
                                                              userInfo:nil
                                                               repeats:true];
          [[NSRunLoop currentRunLoop] addTimer:_bufferingTimer forMode:UITrackingRunLoopMode];
        });

        // Note: Currently doesn't handle heterogeneous clips.
        NSDictionary *firstSource = source[0];
        [_eventDispatcher sendInputEventWithName:@"onVideoLoadStart"
                                            body:@{@"src": @{
                                                       @"uri": [firstSource objectForKey:@"uri"],
                                                       @"type": [firstSource objectForKey:@"type"],
                                                       @"isNetwork":[NSNumber numberWithBool:(bool)[firstSource objectForKey:@"isNetwork"]]},
                                                   @"target": self.reactTag}];
      }
    }
  });
}

- (void)prepareAssetsForSources:(NSArray *)sources
{
  NSMutableArray *assets = [[NSMutableArray alloc] init];
  NSMutableArray *offsets = [[NSMutableArray alloc] init];
  NSMutableArray *durations = [[NSMutableArray alloc] init];
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

    if ([videoTracks count] > 0 || [audioTracks count] > 0) {
      [assets addObject:asset];
      [offsets addObject:[NSNumber numberWithFloat:CMTimeGetSeconds(currentOffset)]];
      [durations addObject:[NSNumber numberWithFloat:CMTimeGetSeconds(asset.duration)]];
    } else {
      NSLog(@"RCTVideo: WARNING - no audio or video tracks for asset %@ (uri: %@), skipping...", asset, uri);
    }
  }
  _clipAssets = assets;
  _clipEndOffsets = offsets;
  _clipDurations = durations;
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

    if ([videoTracks count] > 0 || [audioTracks count] > 0) {
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
        [_eventDispatcher sendInputEventWithName:@"onVideoLoad"
                                            body:@{@"duration": [self totalDuration],
                                                   @"clipDurations": [NSArray arrayWithArray:_clipDurations],
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
      @try {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
      } @catch (NSException *exception) {
        NSLog(@"react-native-video caught exception: %@", exception);
      }
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

- (NSNumber*)totalDuration
{
  float total = 0.0;
  for (NSNumber *duration in _clipDurations) {
    total += [duration floatValue];
  }
  return [NSNumber numberWithFloat:total];
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
 *
 * To begin with, only one player is buffering. When 88% of the first clip has been buffered,
 * the second buffering player starts working on the second clip, with the two players
 * "leapfrogging" until all clips have been buffered. This avoids slowing down the buffering
 * of any single clip by too much, while also aiming for smooth playback between clips.
 * */

- (void)startBufferingClips
{
  if (_bufferingStarted == NO && _shouldBuffer == YES) {
    _bufferingStarted = YES;
    _bufferingPlayerItemA = [AVPlayerItem playerItemWithAsset:_clipAssets[0] 
                                 automaticallyLoadedAssetKeys:@[@"tracks"]];
    _bufferingPlayerA = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemA];
    _mainBufferingPlayer = _bufferingPlayerA;
    _currentlyBufferingIndexA = [NSNumber numberWithInt:0];
    if ([_clipAssets count] > 1) {
      _nextIndexToBuffer = [NSNumber numberWithInt:1];
      _currentlyBufferingIndexB = [NSNumber numberWithInt:1];
    }
  }
}

- (void)updateBufferingProgress
{
  if (_shouldBuffer == YES) {
    if (_bufferingStarted == NO) {
      [self startBufferingClips];
    }
    [self updateBufferingProgressForPlayer :_mainBufferingPlayer];
  }
}

- (void)updateBufferingProgressForPlayer:(AVPlayer*)bufferingPlayer
{
  Float64 playableDurationForMainBufferingItem = [self bufferedDurationForItem :bufferingPlayer];
  Float64 bufferingItemDuration = CMTimeGetSeconds([self playerItemDuration :bufferingPlayer]);
  bool singleClip = !_currentlyBufferingIndexB;
  // This margin is to cover the case where the audio channel has a slightly
  // shorter duration than the video channel.
  bool bufferingComplete = 0.95 * (bufferingItemDuration - playableDurationForMainBufferingItem) < 0.2;

  if (singleClip) {
    if (playableDurationForMainBufferingItem < bufferingItemDuration) {
      [self setPaused :true];
      _pausedForBuffering = YES;
    } else {
      if (_pausedForBuffering == YES) {
        [self setPaused :false];
      }
    }
    return;
  }

  // Now compute the same for the alt buffering player
  AVPlayer* altBufferingPlayer;
  int currentlyBufferingIndexAlt;
  if (bufferingPlayer == _bufferingPlayerA) {
    altBufferingPlayer = _bufferingPlayerB;
    currentlyBufferingIndexAlt = [_currentlyBufferingIndexB intValue];
  } else {
    altBufferingPlayer = _bufferingPlayerA;
    currentlyBufferingIndexAlt = [_currentlyBufferingIndexA intValue];
  }
  Float64 playableDurationForAltBufferingItem = [self bufferedDurationForItem :altBufferingPlayer];

  Float64 altBufferingItemDuration = CMTimeGetSeconds([self playerItemDuration :altBufferingPlayer]);

  bool altBufferingComplete = (0.95 * (altBufferingItemDuration - playableDurationForAltBufferingItem) < 0.2);

  bool startBufferingNextClip = (0.88 * bufferingItemDuration - playableDurationForMainBufferingItem) < 0.0;
  float playerTimeSeconds = CMTimeGetSeconds([_player currentTime]);

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

  if (firstUnbufferedIdx < MAX_IDX) {
    float bufferedOffset = firstUnbufferedIdx == 0 ? 0.0 : [_clipEndOffsets[firstUnbufferedIdx] floatValue];
    float totalBufferedSeconds = bufferedOffset + playableDurationForAltBufferingItem;

    if (totalBufferedSeconds < playerTimeSeconds) {
      [self setPaused :true];
      _pausedForBuffering = YES;
    } else {
      if (_pausedForBuffering == YES) {
        [self setPaused :false];
      }
    }
  }

  if (bufferingComplete) {
    [_bufferedClipIndexes replaceObjectAtIndex:currentlyBufferingIndex withObject:@(YES)];
  }

  if (altBufferingComplete && currentlyBufferingIndexAlt < [_clipAssets count]) {
    [_bufferedClipIndexes replaceObjectAtIndex:currentlyBufferingIndexAlt withObject:@(YES)];
  }

  if (startBufferingNextClip && [_nextIndexToBuffer intValue] < [_clipAssets count]) {
    if (bufferingPlayer == _bufferingPlayerA) {
      _currentlyBufferingIndexB = [_nextIndexToBuffer copy];
      _bufferingPlayerItemB = [AVPlayerItem playerItemWithAsset:_clipAssets[[_nextIndexToBuffer intValue]]
                                  automaticallyLoadedAssetKeys:@[@"tracks"]];
      
      _bufferingPlayerB = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemB];
      _mainBufferingPlayer = _bufferingPlayerB;
    } else {
      _currentlyBufferingIndexA = [_nextIndexToBuffer copy];
      _bufferingPlayerItemA = [AVPlayerItem playerItemWithAsset:_clipAssets[[_nextIndexToBuffer intValue]]
                                  automaticallyLoadedAssetKeys:@[@"tracks"]];
      
      _bufferingPlayerA = [AVPlayer playerWithPlayerItem:_bufferingPlayerItemA];
      _mainBufferingPlayer = _bufferingPlayerA;
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
  _pausedForBuffering = NO;
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
        _playingClipIndex = [self playingClipIndex];
        [_eventDispatcher sendInputEventWithName:@"onVideoSeek"
                                            body:@{@"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                                                   @"seekTime": [NSNumber numberWithFloat:seekTime],
                                                   @"playingClipIndex": [NSNumber numberWithInt:_playingClipIndex],
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

- (void)setSeekClipIndex:(int)clipIndex
{
  float position = clipIndex == 0 ? 0.0 : [[_clipEndOffsets objectAtIndex:(clipIndex - 1)] floatValue];
  [self setSeek: position];
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

- (void)setBuffering:(BOOL)shouldBuffer
{
  _shouldBuffer = (shouldBuffer || NO);
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
  [self setBuffering:_shouldBuffer];
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
  [self removebufferingTimer];
  _queue = nil;

  _eventDispatcher = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  _removed = YES;

  [super removeFromSuperview];
}

@end
