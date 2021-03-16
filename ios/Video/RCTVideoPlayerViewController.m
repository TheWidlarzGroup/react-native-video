#import "RCTVideoPlayerViewController.h"

static NSString *const currentItem = @"currentItem";
const NSInteger kConditionLockWaitingPlayerItem = 0;
const NSInteger kConditionLockShouldProceedWithNewPlayerItem = 1;

@interface RCTVideoPlayerViewController ()
@property (nonatomic, retain) NSConditionLock *conditionLock;
@end

@implementation RCTVideoPlayerViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  [self setupAdView];
  [self setupAdCountdownView];
  _conditionLock = [[NSConditionLock alloc] initWithCondition:kConditionLockWaitingPlayerItem];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  [_rctDelegate videoPlayerViewControllerWillDismiss:self];
  [_rctDelegate videoPlayerViewControllerDidDismiss:self];
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];
  self.adView.frame = self.view.frame;
}

- (void)setupAdView {
  self.adView = [UIView new];
  self.adView.backgroundColor = [UIColor clearColor];
  self.adView.hidden = YES;
  self.delegate = self;
  
  [self.view addSubview:self.adView];
}

- (void)setupAdCountdownView {
  self.adCountdownLabel = [UILabel new];
  self.adCountdownLabel.font = [UIFont boldSystemFontOfSize:36];
  self.adCountdownLabel.textColor = UIColor.whiteColor;
  self.adCountdownLabel.translatesAutoresizingMaskIntoConstraints = NO;
  
  self.adCountdownView = [UIView new];
  self.adCountdownView.backgroundColor = [UIColor.grayColor colorWithAlphaComponent:0.5];
  self.adCountdownView.layer.cornerRadius = 5;
  self.adCountdownView.clipsToBounds = YES;
  self.adCountdownView.translatesAutoresizingMaskIntoConstraints = NO;
  
  [self.adCountdownView addSubview:self.adCountdownLabel];
  [self.adView addSubview:self.adCountdownView];
  
  NSLayoutConstraint *left1 = [NSLayoutConstraint constraintWithItem:self.adCountdownLabel attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:self.adCountdownView attribute:NSLayoutAttributeLeft multiplier:1 constant:20];
  NSLayoutConstraint *bottom1 = [NSLayoutConstraint constraintWithItem:self.adCountdownLabel attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:self.adCountdownView attribute:NSLayoutAttributeBottom multiplier:1 constant:-20];
  NSLayoutConstraint *right1 = [NSLayoutConstraint constraintWithItem:self.adCountdownLabel attribute:NSLayoutAttributeRight relatedBy:NSLayoutRelationEqual toItem:self.adCountdownView attribute:NSLayoutAttributeRight multiplier:1 constant:-20];
  NSLayoutConstraint *top1 = [NSLayoutConstraint constraintWithItem:self.adCountdownLabel attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:self.adCountdownView attribute:NSLayoutAttributeTop multiplier:1 constant:20];
  
  [self.adCountdownView addConstraints:@[left1, bottom1, right1, top1]];
  
  NSLayoutConstraint *left = [NSLayoutConstraint constraintWithItem:self.adCountdownView attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:self.adView attribute:NSLayoutAttributeLeft multiplier:1 constant:40];
  NSLayoutConstraint *bottom = [NSLayoutConstraint constraintWithItem:self.adCountdownView attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:self.adView attribute:NSLayoutAttributeBottom multiplier:1 constant:-40];
  
  [self.adView addConstraints:@[left, bottom]];
}


- (void)avdoris:(AVDoris *)avdoris didReceive:(enum AVDorisEvent)event payload:(id)payload {
    switch (event) {
        case AVDorisEventAD_BREAK_STARTED:
            self.adView.hidden = NO;
            self.requiresLinearPlayback = YES;
            self.adBreakActive = YES;
            [self setNeedsFocusUpdate];
            break;
        case AVDorisEventAD_BREAK_ENDED:
            self.adView.hidden = YES;
            self.requiresLinearPlayback = NO;
            self.adBreakActive = NO;
            [self setNeedsFocusUpdate];
            break;
        case AVDorisEventAD_RANGES_CHANGED:
            if ([payload isKindOfClass:[AdRangesChangedData class]]) {
                AdRangesChangedData *data = payload;
                NSMutableArray *interstitialTimeRanges = [NSMutableArray new];

                for (int i = 0; i < [data.ranges count]; i++) {
                    AdvertisementRange *range = [data.ranges objectAtIndex:i];

                    CMTime adStartTime = CMTimeMake(range.startTime, 1);
                    CMTime adDuration = CMTimeMake(range.endTime - range.startTime, 1);
                    CMTimeRange timeRange = CMTimeRangeMake(adStartTime, adDuration);

                    AVInterstitialTimeRange *seekBarRange = [[AVInterstitialTimeRange alloc] initWithTimeRange:timeRange];
                    [interstitialTimeRanges addObject: seekBarRange];
                }
              
              dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0ul), ^{
                [self.conditionLock lockWhenCondition:kConditionLockShouldProceedWithNewPlayerItem
                                            beforeDate:[[NSDate date] dateByAddingTimeInterval:10.0]];
                [[self.player currentItem] setInterstitialTimeRanges:interstitialTimeRanges];
                [self.conditionLock unlock];
              });
            }
            break;
        case AVDorisEventREQUIRE_AD_TAG_PARAMETERS:
            if ([payload isKindOfClass:[RequireAdTagParametersData class]]) {
              RequireAdTagParametersData *data = payload;
              [self.rctDelegate didRequestAdTagParametersUpdate:data.date.timeIntervalSince1970];
            }
            break;
        case AVDorisEventAD_PROGRESS_CHANGED:
            if ([payload isKindOfClass:[AdProgressChangedData class]]) {
                AdProgressChangedData *data = payload;
              self.adCountdownLabel.text = [self countDownLabelTextFormatted:data];
            }
        default:
            break;
    }
}

- (void)avdoris:(AVDoris *)avdoris didFailWith:(enum AVDorisError)error payload:(id)payload {
    if ([payload isKindOfClass:[AVDorisErrorData class]]) {
        AVDorisErrorData *data = payload;
        [_rctDelegate didFailWithError:error errorData:data];
    }
}

#pragma mark - UIFocusEnvironment
- (NSArray<id<UIFocusEnvironment>> *)preferredFocusEnvironments {
    if (self.isAdBreakActive) {
        // Send focus to the ad display container during an ad break.
        if (self.avdoris) {
            return @[ self.avdoris.adFocusEnvironment ];
        } else {
            return @[ self ];
        }
    } else {
        // Send focus to the content player otherwise.
        return @[ self ];
    }
}

- (void)playerViewController:(AVPlayerViewController *)playerViewController willTransitionToVisibilityOfTransportBar:(BOOL)visible withAnimationCoordinator:(id<AVPlayerViewControllerAnimationCoordinator>)coordinator {
  if (@available(tvOS 11.0, *)) {
    [coordinator addCoordinatedAnimations:^{
      if (visible) {
        [self.adCountdownView setAlpha:0];
      } else {
        [self.adCountdownView setAlpha:1];
      }
    } completion:^(BOOL finished) {
      [self.adCountdownView setHidden:visible];
    }];
  } else {
    [self.adCountdownView setHidden:visible];
  }
}

- (void)playerViewController:(AVPlayerViewController *)playerViewController
willResumePlaybackAfterUserNavigatedFromTime:(CMTime)oldTime
                      toTime:(CMTime)targetTime {
    if (self.avdoris) {
      [self.avdoris seekWithSnapbackTo:targetTime];
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
  if (object == self.player) {
    if([keyPath isEqualToString:currentItem]) {
      [_conditionLock unlockWithCondition:kConditionLockShouldProceedWithNewPlayerItem];
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

- (NSString *)countDownLabelTextFormatted:(AdProgressChangedData *)data {
  int resultTime = (int)data.adDuration - (int)data.time;
  int resultSeconds = resultTime % 60;
  int resultMinutes = (resultTime / 60) % 60;
  int resultHours = resultTime / 3600;
  
  if (resultHours == 0) {
    return [NSString stringWithFormat:@"Ad %d of %d : (%02d:%02d)", (int)data.adPosition, (int)data.totalAds, resultMinutes, resultSeconds];
  } else {
    return [NSString stringWithFormat:@"Ad %d of %d : (%02d:%02d:%02d)", (int)data.adPosition, (int)data.totalAds, resultHours, resultMinutes, resultSeconds];
  }
}

- (void)dealloc {
    [self.player removeObserver:self forKeyPath:currentItem context:nil];
}

@end
