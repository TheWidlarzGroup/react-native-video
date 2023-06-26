#import <React/RCTViewManager.h>
#import <AVFoundation/AVFoundation.h>

@interface RCT_EXTERN_MODULE(RCTVideoManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
RCT_EXPORT_VIEW_PROPERTY(allowsExternalPlayback, BOOL);
RCT_EXPORT_VIEW_PROPERTY(textTracks, NSArray);
RCT_EXPORT_VIEW_PROPERTY(selectedTextTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(selectedAudioTrack, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(playInBackground, BOOL);
RCT_EXPORT_VIEW_PROPERTY(playWhenInactive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(ignoreSilentSwitch, NSString);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(seek, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);
RCT_EXPORT_VIEW_PROPERTY(isFavourite, BOOL);
RCT_EXPORT_VIEW_PROPERTY(buttons, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(theme, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(translations, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(relatedVideos, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(metadata, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(overlayConfig, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(nowPlaying, NSDictionary);

/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */
RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoBuffer, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTimedMetadata, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoAudioBecomingNoisy, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRequireAdParameters, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoAboutToEnd, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onFavouriteButtonClick, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRelatedVideoClicked, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRelatedVideosIconClicked, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onStatsIconClick, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onEpgIconClick, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onAnnotationsButtonClick, RCTBubblingEventBlock);

RCT_EXTERN_METHOD(seekToNow:(nonnull NSNumber *)node)
RCT_EXTERN_METHOD(seekToTimestamp:(nonnull NSNumber *)node isoDate:(NSString *)isoDate)
RCT_EXTERN_METHOD(seekToPosition:(nonnull NSNumber *)node position:(double)position)
RCT_EXTERN_METHOD(replaceAdTagParameters:(nonnull NSNumber *)node payload:(NSDictionary)payload)
RCT_EXTERN_METHOD(seekToResumePosition:(nonnull NSNumber *)node position:(double)position)
RCT_EXTERN_METHOD(limitSeekableRange:(nonnull NSNumber *)node payload:(NSDictionary)payload)

@end
