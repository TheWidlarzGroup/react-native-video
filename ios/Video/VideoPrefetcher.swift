//
//  VideoPrefetcher.swift
//  RCTVideo
//
//  Created by Andrii Drobiazko on 15/09/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

@objc(VideoPrefetcher)
class VideoPrefetcher: NSObject {
    
#if canImport(RCTVideoCache)
    private let _videoCache:RCTVideoCachingHandler = RCTVideoCachingHandler()
#endif
    
    @objc
    func prefetch(_ url: NSString) {
#if canImport(RCTVideoCache)
        _videoCache.cacheVideoForUrl(url as String)
#endif
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
      return true
    }
    
}
