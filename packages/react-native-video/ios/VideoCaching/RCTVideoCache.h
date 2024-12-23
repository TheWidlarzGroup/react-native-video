#import <AVFoundation/AVFoundation.h>
#import <CommonCrypto/CommonDigest.h>
#import <Foundation/Foundation.h>
#import <SPTPersistentCache/SPTPersistentCache.h>
#import <SPTPersistentCache/SPTPersistentCacheOptions.h>

typedef NS_ENUM(NSUInteger, RCTVideoCacheStatus) {
  RCTVideoCacheStatusMissingFileExtension,
  RCTVideoCacheStatusUnsupportedFileExtension,
  RCTVideoCacheStatusNotAvailable,
  RCTVideoCacheStatusAvailable
};

@class SPTPersistentCache;
@class SPTPersistentCacheOptions;

@interface RCTVideoCache : NSObject {
  SPTPersistentCache* videoCache;
  NSString* _Nullable cachePath;
  NSString* temporaryCachePath;
  NSString* _Nullable cacheIdentifier;
}

@property(nonatomic, strong) SPTPersistentCache* _Nullable videoCache;
@property(nonatomic, strong) NSString* cachePath;
@property(nonatomic, strong) NSString* cacheIdentifier;
@property(nonatomic, strong) NSString* temporaryCachePath;

+ (RCTVideoCache*)sharedInstance;
- (void)storeItem:(NSData*)data forUri:(NSString*)uri withCallback:(void (^)(BOOL))handler;
- (void)getItemForUri:(NSString*)url withCallback:(void (^)(RCTVideoCacheStatus, AVAsset* _Nullable))handler;
- (NSURL*)createUniqueTemporaryFileUrl:(NSString* _Nonnull)url withExtension:(NSString* _Nonnull)extension;
- (AVURLAsset*)getItemFromTemporaryStorage:(NSString*)key;
- (BOOL)saveDataToTemporaryStorage:(NSData*)data key:(NSString*)key;
- (void)createTemporaryPath;

@end
