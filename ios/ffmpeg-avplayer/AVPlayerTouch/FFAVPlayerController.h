/*
 *  FFAVPlayerController.h
 *  This file is part of AVPlayerTouch framework.
 *
 *  Player obj-c wrapper class.
 *
 *  Created by iMoreApps on 2/24/2014.
 *  Copyright (C) 2014 iMoreApps Inc. All rights reserved.
 *  Author: imoreapps <imoreapps@gmail.com>
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * AV player states
 **/
typedef NS_ENUM(NSInteger, AVPlayerState) {
  kAVPlayerStateInitialized=0,
  kAVPlayerStatePlaying,
  kAVPlayerStatePaused,
  kAVPlayerStateFinishedPlayback,
  kAVPlayerStateStoped,
  kAVPlayerStateUnknown=0xff
};

/**
 * AV stream discard option
 **/
typedef NS_ENUM(NSInteger, AVStreamDiscardOption) {
  kAVStreamDiscardOptionNone=0,
  kAVStreamDiscardOptionAudio=1,
  kAVStreamDiscardOptionVideo=2,
  kAVStreamDiscardOptionSubtitle=4,
};

/*
 * AV decoding mode
 */
typedef NS_ENUM(NSInteger, AVDecodingMode) {
  kAVDecodingModeAuto=0,
  kAVDecodingModeSW,
  kAVDecodingModeHW,
};

/*
 * AV sync mode
 */
typedef NS_ENUM(NSInteger, AVSyncMode) {
  kAVSyncModeAudio = 0, // Default
  kAVSyncModeVideo = 1
};

@protocol FFAVPlayerControllerDelegate;
@class FFAVSubtitleItem;

/**
 * !!! FFAVPlayerController component is NOT thread-safe !!!
 **/
@interface FFAVPlayerController : NSObject

@property (nonatomic, readonly) NSURL *mediaURL;
@property (nullable, nonatomic, weak) id <FFAVPlayerControllerDelegate> delegate;

@property (nonatomic, assign) BOOL allowBackgroundPlayback;  // default NO
@property (nonatomic, assign) BOOL enableBuiltinSubtitleRender; // default YES
@property (nonatomic, assign) float videoAspectRatio; // default 0

/**
 * "shouldAutoPlay" and "streamDiscardOption" properties
 * can only be changed before you open media.
 **/
@property (nonatomic, assign) BOOL shouldAutoPlay;          // default NO
@property (nonatomic, assign) AVStreamDiscardOption streamDiscardOption;  // default kAVStreamDiscardOptionNone

/*
 * Indicates whether or not audio output of the player is muted.
 * Only affects audio muting for the player instance and not for the device.
 */
@property (nonatomic, assign, getter=isMuted) BOOL muted;

/**
 * av tracks and the current av track index
 */
@property (nonatomic, readonly) NSInteger currentAudioTrack;
@property (nullable, nonatomic, strong, readonly) NSArray *audioTracks;

@property (nonatomic, readonly) NSInteger currentSubtitleTrack;
@property (nullable, nonatomic, strong, readonly) NSArray *subtitleTracks;

/*
 * Throttles frequency of the current playback time change notification.
 * 1s (second) by default.
 */
@property (nonatomic, assign) NSTimeInterval throttleCurrentPlaybackTimeChangeNotification;

/*
 * Get/Set the minmum playable buffer size, default size is 0.
 * @size - the minmum playable buffer size.
 * @value 0 indicates that minimum playable buffer size feature is disabled.
 */
@property (nonatomic) unsigned long long minPlayableBufferSize;

/**
 * av codec bitrate and video frame rate
 */
@property (nonatomic, readonly) long long avBitrate;
@property (nonatomic, readonly) NSInteger avFramerate;

/**
 * Adjust contrast and saturation of the video display.
 * @contrast: 0.0 to 4.0, default 1.0
 * @saturation: 0.0 to 2.0, default 1.0
 **/
@property (nonatomic, assign) float contrast;
@property (nonatomic, assign) float saturation;

/*
 * Adjust the screen's brightness.
 */
@property (nonatomic, assign) float brightness;

/**
 * Decoding mode support
 * @decodingMode: the current decoding mode, user can change it during playback.
 *
 * @canApplyHWDecoder: is the hardware decoder suitable for this av resource?
 * user can and only can query it when got notification of the "FFAVPlayerControllerDidLoad:error:" method.
 */
@property (nonatomic, assign) AVDecodingMode decodingMode;
@property (nonatomic, readonly) BOOL canApplyHWDecoder;

/**
 * Sync mode
 * Audio or Video sync mode.
 */
@property (nonatomic, assign) AVSyncMode syncMode;

/*
 * Convert ISO 639-1/2B/2T language code to full english name.
 * @langCode: ISO 639 language code.
 * @isLeft: YES - show negative symbol.
 * @return full english name of the ISO language code or "Unknown".
 */
+ (NSString *)convertISO639LanguageCodeToEnName:(NSString *)langCode;

/*
 * Format second to human readable time string.
 * @seconds: number of seconds
 * @isLeft: YES - show negative symbol.
 * @return formatted time string.
 */
+ (NSString *)formatTimeInterval:(NSTimeInterval)seconds isLeft:(BOOL)isLeft;

/*
 * Init FFAVPlayerController object.
 * @If failed, return nil, otherwise return initialized FFAVPlayerController instance.
 */
- (id)init;

/*
 * Open media file at path.
 * @url - path to media source.
 * @options - A dictionary filled with AVFormatContext and demuxer-private options.
 * @If failed, return NO, otherwise return YES.
 */
- (BOOL)openMedia:(NSURL *)url withOptions:(nullable NSDictionary *)options;

/*
 * Get drawable view object
 */
- (nullable UIView *)drawableView;

/*
 * Enter or exit full screen mode.
 * @enter - YES to enter, NO to exit.
 * @This function does not return a value.
 */
- (void)fullScreen:(BOOL)enter;

/*
 * Determine AVPlayer whether or not is in full screen mode.
 * @If it is in full screen mode, return YES, otherwise return NO.
 */
- (BOOL)isFullscreen;

/*
 * Has Dolby Digital, audio, video, subtitle stream.
 * @If media has video or audio stream this function return YES, otherwise return NO.
 */
- (BOOL)hasDolby;
- (BOOL)hasAudio;
- (BOOL)hasVideo;
- (BOOL)hasSubtitle;

/*
 * Switch to special audio tracker
 * @index: index of the audio tracker.
 */
- (void)switchAudioTracker:(int)index;

/*
 * Switch to special subtitle stream
 * @index: index of the subtitle stream.
 */
- (void)switchSubtitleStream:(int)index;

/*
 * Open or close external subtitle file support.
 * @path: subtitle file path.
 */
- (BOOL)openSubtitleFile:(NSString *)path;
- (void)closeSubtitleFile;

/*
 * Set subtitle display font.
 * @font: subtitle font.
 */
- (void)setSubtitleFont:(UIFont *)font;

/*
 * Set subtitle text/background color.
 * @textColor: subtitle text color.
 * @backgroundColor: subtitle background color.
 */
- (void)setSubtitleTextColor:(UIColor *)textColor;
- (void)setSubtitleBackgroundColor:(UIColor *)backgroundColor;

/*
 * Query video frame size.
 * @This function return a CGSize value.
 */
- (CGSize)videoFrameSize;

/*
 * Query AVPlayer current state.
 * @This function return AVPlayer current state info.
 */
- (AVPlayerState)playerState;

/*
 * Query media total duration.
 * @This function return media total duration info.
 */
- (NSTimeInterval)duration;

/*
 * Query AVPlayer current playback time.
 * @This function return current playback time info.
 */
- (NSTimeInterval)currentPlaybackTime;

/*
 * Start playback.
 * @ti - playback start position (0 ~ duration).
 * @If failed, return NO, otherwise return YES.
 */
- (BOOL)play:(NSTimeInterval)ti;

/*
 * Fast forward & backward.
 * @Please use "seekto:" method to achieve goals.
 */

/*
 * Pause playback.
 * @This function does not return a value.
 */
- (void)pause;

/*
 * Resume playback.
 * @This function does not return a value.
 */
- (void)resume;

/*
 * Stop playback.
 * @This function does not return a value.
 */
- (void)stop;

/*
 * Seek to position.
 * @ti - 0 ~ duration.
 * @This function does not return a value.
 */
- (void)seekto:(NSTimeInterval)ti;

/*
 * Enable tracking the realtime frame rate changes.
 * @enable - YES to enable or NO to disable.
 * @This function does not return a value.
 */
- (void)enableTrackFramerate:(BOOL)enable;

/*
 * Get the realtime frame rate.
 * @This function return real frame rate in fps.
 */
- (int)realtimeFramerate;
/*
 * Enable tracking the realtime bit rate changes.
 * @enable - YES to enable or NO to disable.
 * @This function does not return a value.
 */
- (void)enableTrackBitrate:(BOOL)enable;

/*
 * Get the realtime bit rate.
 * @This function return real bit rate in kbit/s.
 */
- (int)realtimeBitrate;

/*
 * Get buffering progress.
 * @This function return buffering progress (0~1.0f).
 */
- (int)bufferingProgress;

/*
 * Get playback speed.
 * @speed - new playback speed.
 * @This function does not return a value.
 */
- (void)setPlaybackSpeed:(float)speed;

/*
 * Get playback speed.
 * @This function return current playback speed (0.5~2.0f).
 */
- (float)playbackSpeed;

#if TARGET_OS_IOS

/*
 * Volume control - GET.
 * @This function returns the current volume factor (0~1).
 */
+ (float)currentVolume;

/*
 * Volume control - SET.
 * @fact - volume factor (0~1).
 * @This function does not return a value.
 */
+ (void)setVolume:(float)fact;

#endif

/*
 * Audio session interruption handle.
 * began/ended interruption.
 * @This function does not return a value.
 */
- (void)beganInterruption;
- (void)endedInterruption;

@end


@protocol FFAVPlayerControllerDelegate

@optional

// will load av resource
- (void)FFAVPlayerControllerWillLoad:(FFAVPlayerController *)controller;

// did load av resource
// @error: nil indicates that loaded successfully.
//         non-nil indicates failure.
- (void)FFAVPlayerControllerDidLoad:(FFAVPlayerController *)controller error:(nullable NSError *)error;

// state was changed
- (void)FFAVPlayerControllerDidStateChange:(FFAVPlayerController *)controller;

// current play time was changed
- (void)FFAVPlayerControllerDidCurTimeChange:(FFAVPlayerController *)controller position:(NSTimeInterval)position;

// current buffering progress was changed
- (void)FFAVPlayerControllerDidBufferingProgressChange:(FFAVPlayerController *)controller progress:(double)progress;

// real bitrate was changed
- (void)FFAVPlayerControllerDidBitrateChange:(FFAVPlayerController *)controller bitrate:(NSInteger)bitrate;

// real framerate was changed
- (void)FFAVPlayerControllerDidFramerateChange:(FFAVPlayerController *)controller framerate:(NSInteger)framerate;

// query subtitle's encoding
- (CFStringEncoding)FFAVPlayerControllerQuerySubtitleEncoding:(FFAVPlayerController *)controller subtitleCString:(const char *)subtitleCString;

// current subtitle was changed
- (void)FFAVPlayerControllerDidSubtitleChange:(FFAVPlayerController *)controller subtitleItem:(FFAVSubtitleItem *)subtitleItem;

// enter or exit full screen mode
- (void)FFAVPlayerControllerDidEnterFullscreenMode:(FFAVPlayerController *)controller;
- (void)FFAVPlayerControllerDidExitFullscreenMode:(FFAVPlayerController *)controller;

// error handler
- (void)FFAVPlayerControllerDidOccurError:(FFAVPlayerController *)controller error:(NSError *)error;
@end

NS_ASSUME_NONNULL_END
