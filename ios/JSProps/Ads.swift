//
//  Ads.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 16.10.2023.
//

import AVDoris

struct JSAds: SuperCodable {
    let adUnits: [AdUnit]
    
    var csai: [AdUnit] {
        adUnits.filter{$0.insertionType == .csai}
    }
    
    var ssai: AdUnit? {
        let ssaiConfigs = adUnits.filter{$0.insertionType == .ssai}
        guard let firstConfig = ssaiConfigs.first else { return nil }
        
        return AdUnit(insertionType: firstConfig.insertionType,
                      adFormat: firstConfig.adFormat,
                      adProvider: firstConfig.adProvider,
                      adTagUrl: firstConfig.adTagUrl,
                      adManifestParams: ssaiConfigs.map {$0.adManifestParams ?? []}.reduce([], +))
    }
        
    struct AdUnit: SuperCodable {
        let insertionType: AdInsertionType
        let adFormat: AdFormat
        let adProvider: AdProvider
        let adTagUrl: String?
        let adManifestParams: [QueryParam]?
        
        struct QueryParam: Codable {
            let key: String
            let value: String
        }

        enum AdInsertionType: String, Codable {
            case csai = "CSAI"
            case ssai = "SSAI"
        }

        enum AdProvider: String, Codable {
            case yospace = "YOSPACE"
        }

        enum AdFormat: String, Codable {
            case vmap = "VOD_VMAP"
            case preroll = "PREROLL"
            case midroll = "MIDROLL"
        }
    }
}

extension DorisSSAIProvider {
    init?(adUnit: JSAds.AdUnit, isLive: Bool, playbackUrl: URL, drm: DorisDRMSource?) {
        switch adUnit.adProvider {
        case .yospace:
            if var urlComps = URLComponents(url: playbackUrl, resolvingAgainstBaseURL: true) {
                var newQueryItems = urlComps.queryItems ?? []
                let queryItems = adUnit.adManifestParams?.compactMap {URLQueryItem(name: $0.key, value: $0.value)} ?? []
                newQueryItems.append(contentsOf: queryItems)
                //workaround to make any live stream live-DVR compatible for yospace
                if isLive { newQueryItems.append(URLQueryItem(name: "yo.lpa", value: "dur")) }
                
                urlComps.queryItems = newQueryItems
                if let newURL = urlComps.url {
                    self = .yospace(isLive ? .dvrLive(url: newURL.absoluteString) : .vod(url: newURL.absoluteString),
                                    drm: drm)
                } else {
                    return nil
                }
            } else {
                return nil
            }
        }
    }
}
