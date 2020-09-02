/*
 *  FFAVParser.h
 *  This file is part of AVPlayerTouch framework.
 *
 *  AV parser & thumbnail generating obj-c wrapper class.
 *
 *  Created by iMoreApps on 2/25/2014.
 *  Copyright (C) 2014 iMoreApps Inc. All rights reserved.
 *  Author: imoreapps <imoreapps@gmail.com>
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class FFAVSubtitle;
@class FFAVSubtitleItem;

@interface FFAVParser : NSObject

@property (readonly, nonatomic, strong) NSURL *url;
@property (readonly, nonatomic) NSTimeInterval duration;
@property (readonly, nonatomic) NSUInteger frameWidth;
@property (readonly, nonatomic) NSUInteger frameHeight;
@property (readonly, nonatomic) NSUInteger numberOfSubtitleStreams;

/*
 * show supported protocols, formats, decoders, encoders info.
 */
+ (void)showProtocols;
+ (void)showFormats;
+ (void)showDecoders;
+ (void)showEncoders;

/*
 * retrieve the built-in supported protocol list.
 * @return - as title.
 */
+ (NSArray *)supportedProtocols;

/*
 * Open media file at path.
 * @url - path to media source.
 * @If failed, return NO, otherwise return YES.
 */
- (BOOL)openMedia:(NSURL *)url withOptions:(nullable NSDictionary *)options;

/*
 * Has Dolby Digital, audio, video, subtitle stream.
 * return YES or NO.
 */
- (BOOL)hasDolby;
- (BOOL)hasAudio;
- (BOOL)hasVideo;
- (BOOL)hasSubtitle;

/*
 * generate thumbnail at specified timestamp
 * return an UIImage object if success, otherwise return nil.
 */
- (nullable UIImage *)thumbnailAtTime:(NSTimeInterval)seconds;

/*
 * parse subtitle stream and external subtitle file.
 * return a FFAVSubtitle object that contains a subtitle details,
 * such as start, end time and subtitle text. If subtitle stream is a picture based subtitle type,
 * then returns nil FFAVSubtitle object.
 * "fps" default value is 60.
 */
+ (nullable FFAVSubtitle *)parseSubtitleFile:(NSString *)path encodingQueryHandler:(nullable CFStringEncoding (^)(const char *subtitleCString))encodingQueryHandler frameRate:(double)fps;
- (nullable FFAVSubtitle *)parseSubtitleStreamAtIndex:(NSInteger)streamIndex encodingQueryHandler:(nullable CFStringEncoding (^)(const char *subtitleCString))encodingQueryHandler; // streamIndex < self.numberOfSubtitleStreams

@end


@interface FFAVSubtitle : NSObject
@property (nonatomic, strong, readonly) NSDictionary *metadata;
@property (nonatomic, strong, readonly) NSArray *items; // FFAVSubtitleItem list
@end

@interface FFAVSubtitleItem : NSObject
@property (nonatomic, readonly) long long startTime;  // in millisecond
@property (nonatomic, readonly) long long duration;   // in millisecond
@property (nonatomic, strong, readonly) NSString *text;
@end

NS_ASSUME_NONNULL_END