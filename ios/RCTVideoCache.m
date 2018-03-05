#import "RCTVideoCache.h"

@implementation RCTVideoCache

@synthesize videoCache;
@synthesize cachePath;
@synthesize cacheIdentifier;
@synthesize temporaryCachePath;

+ (RCTVideoCache *) sharedInstance
{
  static RCTVideoCache *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (id)init {
  if (self = [super init]) {
    self.cacheIdentifier = @"rct.video.cache";
    self.temporaryCachePath = [NSTemporaryDirectory() stringByAppendingPathComponent:self.cacheIdentifier];
    self.cachePath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject stringByAppendingPathComponent:self.cacheIdentifier];
    SPTPersistentCacheOptions *options = [SPTPersistentCacheOptions new];
    options.cachePath = self.cachePath;
    options.cacheIdentifier = self.cacheIdentifier;
    options.defaultExpirationPeriod = 60 * 60 * 24 * 30;
    options.garbageCollectionInterval = (NSUInteger)(1.5 * SPTPersistentCacheDefaultGCIntervalSec);
    options.sizeConstraintBytes = 1024 * 1024 * 100;
    options.useDirectorySeparation = NO;
#ifdef DEBUG
    options.debugOutput = ^(NSString *string) {
      NSLog(@"Video Cache: %@", string);
    };
#endif
    [self createTemporaryPath];
    self.videoCache = [[SPTPersistentCache alloc] initWithOptions:options];
    [self.videoCache scheduleGarbageCollection];
  }
  return self;
}

- (void) createTemporaryPath
{
  NSError * error = nil;
  BOOL success = [[NSFileManager defaultManager] createDirectoryAtPath:self.temporaryCachePath
                                           withIntermediateDirectories:YES
                                                            attributes:nil
                                                                 error:&error];
#ifdef DEBUG
  if (!success || error) {
    NSLog(@"Error while! %@", error);
  }
#endif
}

- (void)storeItem:(NSData *)data forUri:(NSString *)uri withCallback:(void(^)(BOOL))handler;
{
  NSString * key = [[self generateHashForUrl:uri] stringByAppendingPathExtension: [uri pathExtension]];
  [self saveDataToTemporaryStorage:data key:key];
  [self.videoCache storeData:data forKey:key locked:NO withCallback:^(SPTPersistentCacheResponse * _Nonnull response) {
    if (response.error) {
#ifdef DEBUG
      NSLog(@"An error occured while saving the video into the cache: %@", [response.error localizedDescription]);
#endif
      handler(NO);
      return;
    }
    handler(YES);
  } onQueue:dispatch_get_main_queue()];
  return;
}

- (AVURLAsset *)getItemFromTemporaryStorage:(NSString *)key {
  NSString * temporaryFilePath =[self.temporaryCachePath stringByAppendingPathComponent:key];
  
  BOOL fileExists = [[NSFileManager defaultManager] fileExistsAtPath:temporaryFilePath];
  if (!fileExists) {
    return nil;
  }
  NSURL * assetUrl = [[NSURL alloc] initFileURLWithPath:temporaryFilePath];
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:assetUrl options:nil];
  return asset;
}

- (BOOL)saveDataToTemporaryStorage:(NSData *)data key:(NSString *)key {
  NSString * temporaryFilePath = [self.temporaryCachePath stringByAppendingPathComponent:key];
  [data writeToFile:temporaryFilePath atomically:YES];
  return YES;
}

- (void)getItemForUri:(NSString *)uri withCallback:(void(^)(AVAsset * _Nullable)) handler {
  NSString * key = [[self generateHashForUrl:uri] stringByAppendingPathExtension: [uri pathExtension]];

  AVURLAsset * temporaryAsset = [self getItemFromTemporaryStorage:key];
  if (temporaryAsset != nil) {
    handler(temporaryAsset);
    return;
  }
  
  [self.videoCache loadDataForKey:key withCallback:^(SPTPersistentCacheResponse * _Nonnull response) {
    if (response.record == nil || response.record.data == nil) {
      handler(nil);
      return;
    }
    [self saveDataToTemporaryStorage:response.record.data key:key];
    handler([self getItemFromTemporaryStorage:key]);
  } onQueue:dispatch_get_main_queue()];
}

- (NSString *) generateHashForUrl:(NSString *)string {
  const char *cStr = [string UTF8String];
  unsigned char result[CC_MD5_DIGEST_LENGTH];
  CC_MD5( cStr, (CC_LONG)strlen(cStr), result );
  
  return [NSString stringWithFormat:
          @"%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X",
          result[0], result[1], result[2], result[3],
          result[4], result[5], result[6], result[7],
          result[8], result[9], result[10], result[11],
          result[12], result[13], result[14], result[15]
          ];
}

@end
