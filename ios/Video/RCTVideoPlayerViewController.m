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

-(void)setupAdView {
  self.adView = [UIView new];
  self.adView.backgroundColor = [UIColor clearColor];
  self.adView.hidden = YES;
  self.delegate = self;
  [self.adView setTranslatesAutoresizingMaskIntoConstraints:NO];
  
  [self.view addSubview:self.adView];
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
            NSLog(@"Hello");
            break;
        default:
            break;
    }
}

#pragma mark - UIFocusEnvironment

- (NSArray<id<UIFocusEnvironment>> *)preferredFocusEnvironments {
    if (self.isAdBreakActive) {
        // Send focus to the ad display container during an ad break.
        if ([self.player isKindOfClass:[AVDoris class]]) {
            AVDoris *avDoris = (AVDoris*) self.player;
            return @[ avDoris.adFocusEnvironment ];
        } else {
            return @[ self ];
        }
    } else {
        // Send focus to the content player otherwise.
        return @[ self ];
    }
}

- (void)playerViewController:(AVPlayerViewController *)playerViewController
willResumePlaybackAfterUserNavigatedFromTime:(CMTime)oldTime
                      toTime:(CMTime)targetTime {
    if ([self.player isKindOfClass:[AVDoris class]]) {
        AVDoris *avDoris = (AVDoris*) self.player;
        [avDoris seekWithSnapbackTo:targetTime];
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

@end
