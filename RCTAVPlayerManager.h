#import "RCTBridgeModule.h"
#import "RCTAVPlayer.h"

@interface RCTAVPlayerManager : NSObject <RCTBridgeModule>

+(RCTAVPlayer*)getPlayer:(NSString*)playerUuid;

@end
