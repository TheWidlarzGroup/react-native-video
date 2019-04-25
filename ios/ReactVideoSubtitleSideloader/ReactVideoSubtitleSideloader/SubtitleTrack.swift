//
//  SubtitleTrack.swift
//  RNDReactNativeDiceVideo
//
//  Created by Lukasz on 24/04/2019.
//  Copyright © 2019 Endeavor Streaming. All rights reserved.
//

import Foundation

@objc public class SubtitleTrack: NSObject {
    let name: String
    let isoCode: String
    let url: URL
    
    @objc init(name: String, isoCode: String, url: URL) {
        self.name = name
        self.isoCode = isoCode
        self.url = url
        super.init()
    }
    
    @objc public static func from(dict: NSDictionary) -> SubtitleTrack? {
        guard let iso = dict["isoCode"] as? String,
            let urlString = dict["url"] as? String, let url = URL(string: urlString) else {
                return nil
        }
        let name =
            NSLocale(localeIdentifier: NSLocale.current.identifier)
                .displayName(forKey: .identifier, value: iso) ?? "Unknown"
        
        return SubtitleTrack(name: name, isoCode: iso, url: url)
    }
}
