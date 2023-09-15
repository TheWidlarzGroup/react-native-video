//
//  RCTPrefetchManager.m
//  RCTVideo
//
//  Created by Andrii Drobiazko on 15/09/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>


@interface RCT_EXTERN_MODULE(VideoPrefetcher, NSObject)

    RCT_EXTERN_METHOD(prefetch: (NSString)url)

@end
