
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@class AVAudioMix;
@class AVAssetTrack;
@class AVPlayerItem;


@protocol AudioTabProcessorDelegate;

@interface AudioTapProcessor : NSObject

// Designated initializer.
- (id)initWithAudioAssetTrack:(AVAssetTrack *)audioAssetTrack;
- (id) initWithAVPlayerItem: (AVPlayerItem *)playerItem;

// Properties
@property (readonly, nonatomic) AVAssetTrack *audioAssetTrack;
@property (readonly, nonatomic) AVAudioMix *audioMix;
@property (weak, nonatomic) id <AudioTabProcessorDelegate> delegate;

@property BOOL compressorEnabled;

@end

#pragma mark - Protocols

@protocol AudioTabProcessorDelegate <NSObject>

// Add comment…
- (void)audioTabProcessor:(AudioTapProcessor *)audioTabProcessor hasNewLeftChannelValue:(float)leftChannelValue rightChannelValue:(float)rightChannelValue;

@end
