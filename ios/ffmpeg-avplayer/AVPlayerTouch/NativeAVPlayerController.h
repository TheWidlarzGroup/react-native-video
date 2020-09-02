/*
 *  NativeAVPlayerController.h
 *  This file is part of AVPlayerTouch framework.
 *
 *  Player obj-c wrapper class.
 *
 *  Created by iMoreApps on 1/6/2015.
 *  Copyright (C) 2015 iMoreApps Inc. All rights reserved.
 *  Author: imoreapps <imoreapps@gmail.com>
 */

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>

NS_ASSUME_NONNULL_BEGIN

@class FFAVSubtitleItem;

@protocol NativeAVPlayerControllerDelegate;

@interface NativeAVPlayerController : NSObject
/* IN parameters */

/*
 * the delegate of NativeAVPlayerController interface.
 * monitor states change of the player.
 */
@property(nullable, nonatomic, weak) id <NativeAVPlayerControllerDelegate> delegate;

/*
 * the URL of av resource, now supports file, http and smb protocols.
 */
@property(nonatomic, retain, readonly) NSURL *mediaURL;

/*
 * Indicates whether the player allows switching to "external playback" mode.
 * YES - enable.
 * NO  - disable.
 * The default value is YES.
 */
@property(nonatomic, assign) BOOL allowsExternalPlayback;

/*
 * Auto play switcher.
 * YES - auto play when loaded av resource.
 * NO  - you should manually invoke "play" method to start playback when loaded av resource.
 * The default value is YES.
 */
@property(nonatomic, assign) BOOL shouldAutoPlay;

/*
 * Allow background playback, user must setup the AVAudioSession category correctly.
 * YES - player will continue playback when app enters background mode.
 * NO  - player will pause playback when app enters background mode.
 * The default value is YES.
 */
@property(nonatomic, assign) BOOL allowBackgroundPlayback;

/*
 * Toggle full screen mode.
 * YES - enter full screen mode.
 * NO  - exit full screen mode.
 * The default value is NO.
 */
@property(nonatomic, assign) BOOL fullScreenMode;

/*
 * The current rate of playback; 
 * 0.0 means "stopped", 1.0 means "play at the natural rate".
 */
@property(nonatomic, assign) float rateOfPlayback;

/*
 * The current time of playback in seconds.
 * user can use the property to achieve the seek feature.
 */
@property(nonatomic, assign) NSTimeInterval currentPlaybackTime;

/*
 * Enable or disable time/progress observer.
 * YES - enable; NO - disable.
 */
@property (nonatomic, assign) BOOL enableTimeObserver;

/*
 * Indicates whether or not audio output of the player is muted.
 * Only affects audio muting for the player instance and not for the device.
 */
@property (nonatomic, assign, getter=isMuted) BOOL muted;

/* OUT parameters */

/*
 * The drawable view object.
 * user can put it in anywhere.
 */
@property(nullable, nonatomic, retain, readonly) UIView *drawableView;

/*
 * Query the title of av resource.
 */
@property(nullable, nonatomic, retain, readonly) NSString *title;

/*
 * Query media total duration in seconds.
 */
@property(nonatomic, readonly) NSTimeInterval duration;

/*
 * Query the video frame size (width & height)
 */
@property(nonatomic, readonly) CGSize videoFrameSize;

/*
 * Query the playback state of player.
 * YES - in playback state.
 * NO  - pause or stop state.
 */
@property(nonatomic, readonly) BOOL isPlaying;

/*
 * Indicates whether the player is currently playing video in "external playback" mode.
 * YES - in external playback mode.
 * NO  - is NOT in external playback mode.
 */
@property(nonatomic, assign, readonly) BOOL externalPlaybackActive;

/*
 * Indicates whether the av resource has video track.
 * YES - has video track.
 * NO  - does NOT have video track.
 */
@property(nonatomic, readonly) BOOL hasVideo;

/*
 * Indicates whether the av resource has audio track.
 * YES - has audio track.
 * NO  - does NOT have audio track.
 */
@property(nonatomic, readonly) BOOL hasAudio;

/*
 * The current index of audio track.
 */
@property (nonatomic, readonly) NSInteger currentAudioTrack;

/*
 * Audio track list, a NSDictionary object list.
 */
@property (nullable, nonatomic, readonly) NSArray *audioTracks;

/*
 * Toggle built-in subtitle render, default YES.
 * YES - enable it.
 * NO  - disable it.
 */
@property (nonatomic, assign) BOOL enableBuiltinSubtitleRender;

/*
 * Open media file at path with special http header options.
 * @url: url of the media file.
 * @options: HTTP(s) customized headers, user can pass customized http headers via AVOptionNameHttpHeader option key.
 * YES - success; NO - failure.
 */
- (BOOL)openMedia:(NSURL *)url options:(nullable NSDictionary *)options;

/*
 * Control methods
 */
- (void)play;
- (void)pause;
- (void)stop;

/*
 * Switch to special audio tracker
 * @index: index of the audio tracker.
 */
- (void)switchAudioTracker:(int)index;

/*
 * Open external subtitle file.
 * @path: subtitle file path.
 * @return: YES for success, NO for failure.
 */
- (BOOL)openSubtitleFile:(NSString *)path;

/*
 * Close the current external subtitle.
 */
- (void)closeSubtitleFile;

/*
 * Set subtitle display font.
 * @font: subtitle font.
 */
- (void)setSubtitleFont:(UIFont *)font;

/*
 * Set subtitle text/background color.
 * @textColor: subtitle text/background color.
 * @backgroundColor: subtitle background color.
 */
- (void)setSubtitleTextColor:(UIColor *)textColor;
- (void)setSubtitleBackgroundColor:(UIColor *)backgroundColor;
@end


@protocol NativeAVPlayerControllerDelegate

@optional

// will load av resource
- (void)NativeAVPlayerControllerWillLoad:(NativeAVPlayerController *)controller;

// did load av resource
- (void)NativeAVPlayerControllerDidLoad:(NativeAVPlayerController *)controller;

// state change
- (void)NativeAVPlayerControllerDidStateChange:(NativeAVPlayerController *)controller;

// buffering...
- (void)NativeAVPlayerControllerBeginBuffering:(NativeAVPlayerController *)controller;
- (void)NativeAVPlayerControllerEndBuffering:(NativeAVPlayerController *)controller;

// current play time was changed
- (void)NativeAVPlayerControllerDidCurTimeChange:(NativeAVPlayerController *)controller position:(NSTimeInterval)position;

// query subtitle's encoding
- (CFStringEncoding)NativeAVPlayerControllerQuerySubtitleEncoding:(NativeAVPlayerController *)controller subtitleCString:(const char *)subtitleCString;

// current subtitle was changed
- (void)NativeAVPlayerControllerDidSubtitleChange:(NativeAVPlayerController *)controller subtitleItem:(FFAVSubtitleItem *)subtitleItem;

// did finish plaback
- (void)NativeAVPlayerControllerDidFinishPlayback:(NativeAVPlayerController *)controller;

// did occur error
- (void)NativeAVPlayerController:(NativeAVPlayerController *)controller didOccurError:(NSError *)error;

// enter or exit full screen mode
- (void)NativeAVPlayerControllerDidEnterFullScreenMode:(NativeAVPlayerController *)controller;
- (void)NativeAVPlayerControllerDidExitFullScreenMode:(NativeAVPlayerController *)controller;

// HTTPs authentication challenge  [iOS 8.0 or later]

// Invoked when assistance is required of the application to respond to an authentication challenge.
// Delegates receive this message when assistance is required of the application to respond to an authentication challenge.
// If the result is YES, the player expects you to send an appropriate response, either subsequently or immediately,
// to the NSURLAuthenticationChallenge's sender, i.e. [authenticationChallenge sender],
// via use of one of the messages defined in the NSURLAuthenticationChallengeSender protocol (see NSAuthenticationChallenge.h).
// If you intend to respond to the authentication challenge after your handling of -shouldWaitForResponseToAuthenticationChallenge: returns,
// you must retain the instance of NSURLAuthenticationChallenge until after your response has been made.
- (BOOL)NativeAVPlayerController:(NativeAVPlayerController *)controller shouldWaitForResponseToAuthenticationChallenge:(NSURLAuthenticationChallenge *)authenticationChallenge;

// Informs the delegate that a prior authentication challenge has been cancelled.
- (void)NativeAVPlayerController:(NativeAVPlayerController *)controller didCancelAuthenticationChallenge:(NSURLAuthenticationChallenge *)authenticationChallenge;
@end

NS_ASSUME_NONNULL_END