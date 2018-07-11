#import "RCTVideoCache.h"
#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>
#import "AVKit/AVKit.h"

// RCTVideoCache.m
@implementation RCTVideoCache

@synthesize videoCache;

// To export a module named RCTVideoCache
RCT_EXPORT_MODULE();

+ (id)sharedCache {
    static RCTVideoCache *sharedCache = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedCache = [[self alloc] init];
    });
    return sharedCache;
}

- (id)init {
  if (self = [super init]) {
      videoCache = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)dealloc {
  // Should never be called, but just here for clarity really.
}


RCT_EXPORT_METHOD(preloadVideo:(NSString *)url)
{
    NSLog(@"preloadVideo %@", url);

    RCTVideoCache *sharedCache = [RCTVideoCache sharedCache];
    if ([sharedCache.videoCache objectForKey:url]) {
        return;
    }

    AVURLAsset *asset = [[AVURLAsset alloc] initWithURL:[NSURL URLWithString:url] options:nil];
    NSArray *keys = @[@"playable", @"tracks", @"duration"];

    NSLog(@"Caching...");

    [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^()
    {
        // make sure everything downloaded properly
        for (NSString *thisKey in keys) {
            NSError *error = nil;
            AVKeyValueStatus keyStatus = [asset statusOfValueForKey:thisKey error:&error];
            if (keyStatus == AVKeyValueStatusFailed) {
                NSLog(@"Cache failed");
                return;
            }
        }

        dispatch_async(dispatch_get_main_queue(), ^ {
            NSLog(@"Cache succeeded");
            sharedCache.videoCache[url] = asset;
        });
    }];
}

@end
