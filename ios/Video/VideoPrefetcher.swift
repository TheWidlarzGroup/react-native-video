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
    

    private let _videoCache:RCTVideoCachingHandler = RCTVideoCachingHandler.instance

    
    @objc
    func prefetch(_ url: NSString) {
        _videoCache.cacheVideoForUrl(url as String)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
      return true
    }
    
}
