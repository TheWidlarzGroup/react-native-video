//
//  RCTVideoPrefetcher.swift
//  RCTVideo
//
//  Created by Andrii Drobiazko on 15/09/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation
import React

@objc(RCTVideoPrefetcher)
class RCTVideoPrefetcher: NSObject {
    
    @objc
    func cacheVideoForUrl(_ url: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        RCTVideoCachingHandler.cacheVideoForUrl(url, resolver: resolve, rejecter: reject)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    static func moduleName() -> String! {
        return "RCTVideoPrefetcher"
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    static func canOverrideExistingModule() -> Bool {
        return true
    }
    
}

@objc(RCTVideoPrefetcher)
extension RCTVideoPrefetcher: RCTBridgeModule {}
