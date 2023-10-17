//
//  AVDorisSourceMapper.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 27.05.2021.
//

import AVDoris

enum AVDorisSourceType {
    case ssai(DorisSSAISource)
    case csai(DorisCSAISource)
    case regular(DorisSource)
    case unknown
}

class AVDorisSourceMapper {
    private let adTagParametersModifier = AdTagParametersModifier()
    
    func map(source: Source?, view: UIView?, completion: @escaping (AVDorisSourceType) -> Void) {
        guard let source = source else { return }
        
        var drmData: DorisDRMSource?
        if let drm = source.drm {
            drmData = DorisDRMSource(contentUrl: source.uri.absoluteString,
                                     croToken: drm.croToken,
                                     licensingServerUrl: drm.licensingServerUrl)
        }
        
        if let ima = source.ima {
            adTagParametersModifier.prepareAdTagParameters(adTagParameters: ima.adTagParameters,
                                                           info: AdTagParametersModifierInfo(viewWidth: view?.bounds.width ?? 0,
                                                                                             viewHeight: view?.bounds.height ?? 0)) { newAdTagParameters in
                if let assetKey = ima.assetKey {
                    let liveData = DorisImaLiveData(assetKey: assetKey,
                                                    authToken: ima.authToken,
                                                    adTagParameters: newAdTagParameters,
                                                    adTagParametersValidFrom: ima.startDate,
                                                    adTagParametersValidUntil: ima.endDate,
                                                    drm: drmData)
                    
                    let liveDAISource = DorisSSAISource(provider: .ima(.live(liveData)))
                    
                    completion(.ssai(liveDAISource))
                } else if let contentSourceId = ima.contentSourceId, let videoId = ima.videoId {
                    let vodData = DorisImaVODData(contentSourceId: contentSourceId,
                                                  videoId: videoId,
                                                  authToken: ima.authToken,
                                                  adTagParameters: newAdTagParameters,
                                                  drm: drmData)
                    
                    let vodDAISource = DorisSSAISource(provider: .ima(.vod(vodData)))

                    completion(.ssai(vodDAISource))
                } else {
                    completion(.unknown)
                }
            }
            
        } else if let ads = source.ads {
            if let ssai = ads.ssai {
                let source = DorisSSAISource(provider: DorisSSAIProvider(adUnit: ssai, isLive: source.live ?? false, playbackUrl: source.uri))
            } else if !ads.csai.isEmpty {
                let source = DorisCSAISource(contentURL: source.uri,
                                             preroll: ads.csai.first(where: {$0.adFormat == .preroll})?.adTagUrl,
                                             liveMidroll: ads.csai.first(where: {$0.adFormat == .midroll})?.adTagUrl,
                                             textTracks: sideloadedSubtitles(from: source))
                
                source.drm = drmData
                completion(.csai(source))
            }
            
        } else {
            let source = DorisSource(url: source.uri, textTracks: sideloadedSubtitles(from: source))
            source.drm = drmData
            completion(.regular(source))
        }
    }
    
    private func sideloadedSubtitles(from source: Source) -> [DorisTextTrack] {
        var textTracks = [DorisTextTrack]()
        if let subtitles = source.subtitles, source.live != true {
            textTracks = subtitles
                .compactMap{$0}
                .filter{$0.isVtt}
                .map {DorisTextTrack(name: $0.name,
                                     isoCode: $0.language,
                                     url: $0.uri)}
        }
        
        return textTracks
    }
}
