//
//  AVDorisSourceMapper.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 27.05.2021.
//

import AVDoris

class AVDorisSourceMapper {
    private let adTagParametersModifier = AdTagParametersModifier()
    
    func map(source: Source, view: UIView?, completion: @escaping (DorisSource?) -> Void) {
        var drmData: DorisDRMSource?
        if let drm = source.drm {
            drmData = DorisDRMSource(contentUrl: source.uri.absoluteString,
                                     croToken: drm.croToken,
                                     licensingServerUrl: drm.licensingServerUrl)
        }

        var dorisSource: DorisSource?
        if let ima = source.ima {
            adTagParametersModifier
                .prepareAdTagParameters(adTagParameters: ima.adTagParameters,
                                        info: AdTagParametersModifierInfo(viewWidth: view?.bounds.width ?? 0,
                                                                          viewHeight: view?.bounds.height ?? 0)) { newAdTagParameters in
                    if let assetKey = ima.assetKey {
                        dorisSource = DorisSource(type: .ssai(.ima(.live(DorisImaLiveData(assetKey: assetKey,
                                                                                                    authToken: ima.authToken,
                                                                                                    adTagParameters: newAdTagParameters,
                                                                                                    adTagParametersValidFrom: ima.startDate,
                                                                                                    adTagParametersValidUntil: ima.endDate)))),
                                                                                                    drm: drmData)
                    } else if let contentSourceId = ima.contentSourceId, let videoId = ima.videoId {
                        dorisSource = DorisSource(type: .ssai(.ima(.vod(DorisImaVODData(contentSourceId: contentSourceId,
                                                                                                    videoId: videoId,
                                                                                                    authToken: ima.authToken,
                                                                                                    adTagParameters: newAdTagParameters)))),
                                                                                                    drm: drmData)
                    }
                }

        } else if let ads = source.ads {
            if let ssai = ads.ssai, let provider = DorisSSAIProvider(adUnit: ssai, isLive: source.live, playbackUrl: source.uri) {
                dorisSource = DorisSource(type: .ssai(provider), textTracks: sideloadedSubtitles(from: source), drm: drmData)
            } else if !ads.csai.isEmpty {
                if source.live {
                    dorisSource = DorisSource(type: .csai(.ima(.live(source.uri, prerollUrl: ads.csai.first(where: {$0.adFormat == .preroll })?.adTagUrl, midrollUrl: ads.csai.first(where: {$0.adFormat == .midroll})?.adTagUrl))), textTracks: sideloadedSubtitles(from: source), drm: drmData)
                } else {
                    dorisSource = DorisSource(type: .csai(.ima(.vod(source.uri, adUrl: ads.csai.first(where: {$0.adFormat == .vmap})?.adTagUrl))), textTracks: sideloadedSubtitles(from: source), drm: drmData)
                }
            } else {
                dorisSource = DorisSource(type: .url(source.uri), textTracks: sideloadedSubtitles(from: source), drm: drmData)
            }
            
        } else {
            dorisSource = DorisSource(type: .url(source.uri), textTracks: sideloadedSubtitles(from: source), drm: drmData)
        }
        completion(dorisSource)
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
