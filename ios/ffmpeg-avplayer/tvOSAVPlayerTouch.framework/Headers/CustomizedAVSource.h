//
//  CustomizedAVSource.h
//  AVPlayerTouch
//
//  Created by apple on 15/6/25.
//  Copyright (c) 2015年 apple. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol CustomizedAVSource <NSObject>
@optional
// translate URI
+ (NSString *)translateURLStringToPath:(NSString *)urlString;

@required
// last error
- (nullable NSError *)lastError;

// open/close av source
- (BOOL)open:(NSString *)uri;
- (void)close;

// abort operations
- (void)abort;

// query the file size info
- (unsigned long long)fileSize;

// read data from av source
- (unsigned int)read:(void *)buffer size:(unsigned int)size;

// seek av source
- (long long)seekto:(long long)offset whence:(int)whence;
@end


// Customized av source store
@interface CustomizedAVSourceStore : NSObject
+ (instancetype)sharedInstance;

#pragma mark - AVSource Class Store

// register an av source class for url scheme
- (void)registerAVSourceClass:(Class)avsourceClass forScheme:(NSString *)scheme;

// unregister an av source class for url scheme
- (void)unregisterAVSourceClassWithScheme:(NSString *)scheme;

// query an av source class for url scheme
- (nullable Class)avsourceClassForScheme:(NSString *)scheme;

#pragma mark - URL Context Store

// register av source context for an url key
- (void)registerAVSourceURLContext:(id)context forURLKey:(id)key;

// unregister av source context for an url key
- (void)unregisterAVSourceURLContextWithURLKey:(id)key;

// query av source context for an url key
- (nullable id)avsourceURLContextForURLKey:(id)key;

// clear all av source contexts
- (void)clearAllAVSourceURLContexts;
@end

NS_ASSUME_NONNULL_END
