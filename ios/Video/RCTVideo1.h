#import <React/RCTView.h>
#import <AVFoundation/AVFoundation.h>
#import "AVKit/AVKit.h"
#if __has_include(<react-native-video/RCTVideoCache.h>)
#import <react-native-video/RCTVideoCache.h>
#import <DVAssetLoaderDelegate/DVURLAsset.h>
#import <DVAssetLoaderDelegate/DVAssetLoaderDelegate.h>
#endif
@import AVDoris;

@class RCTEventDispatcher;

@interface RCTVideo1 : UIView <DorisExternalOutputProtocol>

@property (nonatomic, copy) RCTBubblingEventBlock onVideoLoadStart;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoLoad;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoBuffer;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoError;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoProgress;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoSeek;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoEnd;
@property (nonatomic, copy) RCTBubblingEventBlock onTimedMetadata;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoAudioBecomingNoisy;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoFullscreenPlayerWillPresent;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoFullscreenPlayerDidPresent;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoFullscreenPlayerWillDismiss;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoFullscreenPlayerDidDismiss;
@property (nonatomic, copy) RCTBubblingEventBlock onReadyForDisplay;
@property (nonatomic, copy) RCTBubblingEventBlock onPlaybackStalled;
@property (nonatomic, copy) RCTBubblingEventBlock onPlaybackResume;
@property (nonatomic, copy) RCTBubblingEventBlock onPlaybackRateChange;
@property (nonatomic, copy) RCTBubblingEventBlock onRequireAdParameters;
@property (nonatomic, copy) RCTBubblingEventBlock onVideoAboutToEnd;
@property (nonatomic, strong) IMAPlayer *player;
@property (nonatomic, strong) DorisUIModule *dorisUI;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;
- (void)setSeek:(NSDictionary *)info;

@end
