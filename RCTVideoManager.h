#import "RCTBridgeModule.h"
#import "RCTVideo.h"

@interface RCTVideoManager : NSObject <RCTBridgeModule>

+(RCTVideo*)getPlayer:(NSString*)playerUuid;

@end
