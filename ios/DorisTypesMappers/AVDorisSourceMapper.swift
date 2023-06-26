//
//  AVDorisSourceMapper.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 27.05.2021.
//

import AVDoris

enum AVDorisSourceType {
    case ima(DAISource)
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
                    let liveDAISource = DAISource(assetKey: assetKey,
                                                  authToken: ima.authToken,
                                                  adTagParameters: newAdTagParameters,
                                                  adTagParametersValidFrom: ima.startDate,
                                                  adTagParametersValidUntil: ima.endDate)
                    
                    liveDAISource.drm = drmData
                    
                    completion(.ima(liveDAISource))
                } else if let contentSourceId = ima.contentSourceId, let videoId = ima.videoId {
                    let vodDAISource = DAISource(contentSourceId: contentSourceId,
                                                 videoId: videoId,
                                                 authToken: ima.authToken,
                                                 adTagParameters: newAdTagParameters)
                    
                    vodDAISource.drm = drmData
                    
                    completion(.ima(vodDAISource))
                } else {
                    completion(.unknown)
                }
            }
            
        } else {
            let source = DorisSource(url: source.uri, textTracks: sideloadedSubtitles(from: source))
            source.drm = drmData
            completion(.regular(source))
        }
    }
    
    private func sideloadedSubtitles(from source: Source) -> [DorisTextTrack] {
        var textTracks = [DorisTextTrack]()
        if let subtitles = source.subtitles, source.live == false {
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
