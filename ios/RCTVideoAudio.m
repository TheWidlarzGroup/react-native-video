//
//  RCTVideoAudio.m
//  RCTVideo
//
//  Created by Alex Jarvis on 14/03/2017.
//

#import "RCTVideoAudio.h"

@interface RCTVideoAudio()

@property (atomic) NSUInteger count;

@end

@implementation RCTVideoAudio

+ (instancetype)sharedInstance
{
    static RCTVideoAudio *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[RCTVideoAudio alloc] init];
        sharedInstance.count = 0;
    });
    return sharedInstance;
}

- (void)addComponent
{
    NSUInteger previousCount = self.count;
    self.count = previousCount + 1;
    [self setAudioSessionWithCount:self.count previousCount:previousCount];
}

- (void)removeComponent
{
    NSUInteger previousCount = self.count;
    self.count = MAX(0, previousCount - 1);
    [self setAudioSessionWithCount:self.count previousCount:previousCount];
}

- (void)setAudioSessionWithCount:(NSUInteger)count previousCount:(NSUInteger)previousCount
{
    if (count > 0 && previousCount == 0) {
        [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:nil];
        [[AVAudioSession sharedInstance] setActive:YES error:nil];
    } else if (count == 0 && previousCount > 0) {
        // Delay to prevent error:
        // Deactivating an audio session that has running I/O. All I/O should be stopped or paused prior to deactivating the audio session.
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];
            [[AVAudioSession sharedInstance] setActive:NO error:nil];
        });
    }
}

@end
