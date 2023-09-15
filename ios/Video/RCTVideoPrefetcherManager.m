//
//  RCTVideoPrefetcherManager.m
//  RCTVideo
//
//  Created by Andrii Drobiazko on 15/09/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//


#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import "RCTVideoCachingHandler.h"

@interface RCTVideoPrefetcher : NSObject <RCTBridgeModule>

@end

@implementation RCTVideoPrefetcher

RCT_EXTERN_METHOD(cacheVideoForUrl:(NSString *)url resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);

- (BOOL)requiresMainQueueSetup {
    return YES;
}

@end
