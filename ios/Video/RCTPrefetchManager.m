//
//  RCTPrefetchManager.m
//  RCTVideo
//
//  Created by Andrii Drobiazko on 15/09/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCTVideoPrefetcher: NSObject<RCTBridgeModule>
@end

@implementation RCTVideoPrefetcher
RCT_EXPORT_MODULE(VideoPrefetcher);


#if canImport(RCTVideoCache)
    private let _videoCache:RCTVideoCachingHandler = RCTVideoCachingHandler()
#endif

RCT_EXPORT_METHOD(prefetch:(NSString *)url)
{
  // prefetch video
  RCTLogInfo(@"Pretending to prefetch a video %@", url);
  #if canImport(RCTVideoCache)
    [_videoCache cacheVideoForUrl:url];
#endif
}
@end
