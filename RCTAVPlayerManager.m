#import "RCTAVPlayerManager.h"
#import "RCTAVPlayer.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import <AVFoundation/AVFoundation.h>

@implementation RCTAVPlayerManager


RCT_EXPORT_MODULE(AVPlayer);

@synthesize bridge;

/* Should support: onLoadStart, onLoad, and onError to stay consistent with Image */

- (NSArray *)customDirectEventTypes
{
  return @[
    @"onVideoLoadStart",
    @"onVideoLoad",
    @"onVideoError",
    @"onVideoProgress",
    @"onVideoSeek",
    @"onVideoEnd"
  ];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

static NSMutableDictionary* _players;

RCT_EXPORT_METHOD(createVideoPlayer:(NSString*)uuid)
{
    if (_players == nil)
        _players = [NSMutableDictionary dictionary];
    RCTAVPlayer* player = [[RCTAVPlayer alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
    player.uuid = uuid;
    [_players setObject:player forKey:player.uuid];
}

RCT_EXPORT_METHOD(setSource:(NSString*)playerUuid withSource:(NSDictionary*)source withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setSrc:source];
    callback(@[[NSNull null], player.uuid]);
}

RCT_EXPORT_METHOD(setRepeat:(NSString*)playerUuid withRepeat:(BOOL)repeat withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setRepeat:repeat];
    callback(@[[NSNull null], player.uuid]);
}


RCT_EXPORT_METHOD(setMuted:(NSString*)playerUuid withMuted:(BOOL)muted withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setMuted:muted];
    callback(@[[NSNull null], player.uuid]);
}

RCT_EXPORT_METHOD(setVolume:(NSString*)playerUuid withVolume:(float)volume withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setVolume:volume];
    callback(@[[NSNull null], player.uuid]);
}


RCT_EXPORT_METHOD(setRate:(NSString*)playerUuid withRate:(float)rate withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setRate:rate];
    callback(@[[NSNull null], player.uuid]);
}


RCT_EXPORT_METHOD(setSeek:(NSString*)playerUuid withSeek:(float)seek withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    RCTAVPlayer* player = _players[playerUuid];
    [player setSeek:seek];
    callback(@[[NSNull null], player.uuid]);
}

RCT_EXPORT_METHOD(removePlayer:(NSString*)playerUuid withCallback:(RCTResponseSenderBlock)callback)
{
    if (_players == nil || !_players[playerUuid])
    {
        callback(@[@"ERROR: Player with uuid not found!"]);
        return;
    }
    [_players removeObjectForKey:playerUuid];
    callback(@[[NSNull null], playerUuid]);
}

+(RCTAVPlayer*)getPlayer:(NSString *)playerUuid
{
    if (_players == nil || !_players[playerUuid])
    {
        NSLog(@"Failed getting player with uuid!");
        return nil;
    }
    return _players[playerUuid];
}

@end
