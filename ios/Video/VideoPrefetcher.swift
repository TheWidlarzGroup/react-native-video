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
    

    private let _videoCache:RCTVideoCacheStorage = RCTVideoCacheStorage.instance

    
    @objc
    func prefetch(_ url: NSString) {
        _videoCache.prefetchVideoForUrl(url as String)
    }


    @objc
    func removeVideoForUrl(_ url: String) {
        _videoCache.removeVideoForUrl(url)
    }

    @objc
    func clearCache() {
        _videoCache.clearCache()
    }

    @objc
    func setCacheMaxSize(_ newSize: Int64) {
        _videoCache.setCacheMaxSize(newSize)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
      return true
    }
    
}
