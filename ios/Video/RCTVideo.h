#import <AVFoundation/AVFoundation.h>
#import "AVKit/AVKit.h"
#import "UIView+FindUIViewController.h"
#import "RCTVideoPlayerViewController.h"
#import "RCTVideoPlayerViewControllerDelegate.h"
#import <React/RCTComponent.h>
#import <React/RCTBridgeModule.h>

@class RCTEventDispatcher;
#if TARGET_OS_TV
@interface RCTVideo : UIView <RCTVideoPlayerViewControllerDelegate>
#else
@interface RCTVideo : UIView <RCTVideoPlayerViewControllerDelegate, AVPictureInPictureControllerDelegate>
#endif

@property (nonatomic, copy) RCTDirectEventBlock onVideoLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onVideoLoad;
@property (nonatomic, copy) RCTDirectEventBlock onVideoBuffer;
@property (nonatomic, copy) RCTDirectEventBlock onVideoError;
@property (nonatomic, copy) RCTDirectEventBlock onVideoProgress;
@property (nonatomic, copy) RCTDirectEventBlock onBandwidthUpdate;
@property (nonatomic, copy) RCTDirectEventBlock onVideoSeek;
@property (nonatomic, copy) RCTDirectEventBlock onVideoEnd;
@property (nonatomic, copy) RCTDirectEventBlock onTimedMetadata;
@property (nonatomic, copy) RCTDirectEventBlock onVideoAudioBecomingNoisy;
@property (nonatomic, copy) RCTDirectEventBlock onVideoFullscreenPlayerWillPresent;
@property (nonatomic, copy) RCTDirectEventBlock onVideoFullscreenPlayerDidPresent;
@property (nonatomic, copy) RCTDirectEventBlock onVideoFullscreenPlayerWillDismiss;
@property (nonatomic, copy) RCTDirectEventBlock onVideoFullscreenPlayerDidDismiss;
@property (nonatomic, copy) RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) RCTDirectEventBlock onPlaybackStalled;
@property (nonatomic, copy) RCTDirectEventBlock onPlaybackResume;
@property (nonatomic, copy) RCTDirectEventBlock onPlaybackRateChange;
@property (nonatomic, copy) RCTDirectEventBlock onVideoExternalPlaybackChange;
@property (nonatomic, copy) RCTDirectEventBlock onPictureInPictureStatusChanged;
@property (nonatomic, copy) RCTDirectEventBlock onRestoreUserInterfaceForPictureInPictureStop;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (AVPlayerViewController*)createPlayerViewController:(AVPlayer*)player withPlayerItem:(AVPlayerItem*)playerItem;

- (void)save:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end
