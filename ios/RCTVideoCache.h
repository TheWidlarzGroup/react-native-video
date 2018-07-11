// RCTVideoCache.h
#import <React/RCTBridgeModule.h>

@interface RCTVideoCache : NSObject <RCTBridgeModule>

@property (nonatomic, retain) NSMutableDictionary *videoCache;

+ (id)sharedCache;

@end