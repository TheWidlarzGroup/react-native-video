//
//  RNNewPlayerView.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 05.03.2021.
//

import React
import AVDoris
import AVKit
import RNDReactNativeDiceVideo

class NewPlayerView: UIView, JSInputProtocol {
    var jsBridge: RCTBridge?
    //Events
    //used
    @objc var onBackButton: RCTBubblingEventBlock?
    @objc var onVideoLoad: RCTBubblingEventBlock?
    @objc var onVideoError: RCTBubblingEventBlock?
    @objc var onVideoProgress: RCTBubblingEventBlock?
    @objc var onVideoEnd: RCTBubblingEventBlock?
    @objc var onPlaybackRateChange: RCTBubblingEventBlock?
    @objc var onRequireAdParameters: RCTBubblingEventBlock?
    @objc var onRelatedVideoClicked: RCTBubblingEventBlock?
    @objc var onSubtitleTrackChanged: RCTBubblingEventBlock?
    @objc var onAudioTrackChanged: RCTBubblingEventBlock?
    @objc var onVideoBuffer: RCTBubblingEventBlock?
    @objc var onVideoAboutToEnd: RCTBubblingEventBlock?
    @objc var onFavouriteButtonClick: RCTBubblingEventBlock?
    @objc var onRelatedVideosIconClicked: RCTBubblingEventBlock?
    @objc var onStatsIconClick: RCTBubblingEventBlock?
    @objc var onEpgIconClick: RCTBubblingEventBlock?
    @objc var onAnnotationsButtonClick: RCTBubblingEventBlock?
    @objc var onWatchlistButtonClick: RCTBubblingEventBlock?
    
    //not used
    @objc var onVideoLoadStart: RCTBubblingEventBlock?
    @objc var onVideoSeek: RCTBubblingEventBlock?
    @objc var onTimedMetadata: RCTBubblingEventBlock?
    @objc var onVideoAudioBecomingNoisy: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerWillPresent: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerDidPresent: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerWillDismiss: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerDidDismiss: RCTBubblingEventBlock?
    @objc var onReadyForDisplay: RCTBubblingEventBlock?
    @objc var onPlaybackStalled: RCTBubblingEventBlock?
    @objc var onPlaybackResume: RCTBubblingEventBlock?
    
    //Props
    //MARK: Differs (source)
    @objc var src: NSDictionary? {
        didSet {
            do {
                let source = try Source(dict: src)
                guard source.uri.absoluteString != jsProps.source.value?.uri.absoluteString else { return }
                jsPlayerView?.removeFromSuperview()
                jsPlayerView = nil
                jsProps.source.value = source
            } catch {
                onVideoError?(["value": self.src ?? [:], "error": (error as NSError).description])
            }
        }
    }
    @objc var partialVideoInformation: NSDictionary? {
        didSet { jsProps.partialVideoInformation.value = try? PartialVideoInformation(dict: partialVideoInformation) } }
    @objc var translations: NSDictionary? {
        didSet { jsProps.translations.value = try? Translations(dict: translations) } }
    @objc var buttons: NSDictionary? {
        didSet { jsProps.buttons.value = try? Buttons(dict: buttons) } }
    @objc var theme: NSDictionary? {
        didSet { jsProps.theme.value = try? Theme(dict: theme) } }
    @objc var relatedVideos: NSDictionary? {
        didSet { jsProps.relatedVideos.value = try? RelatedVideos(dict: relatedVideos) } }
    @objc var metadata: NSDictionary? {
        didSet { jsProps.metadata.value = try? Metadata(dict: metadata) } }
    @objc var overlayConfig: NSDictionary? {
        didSet { jsProps.overlayConfig.value = try? OverlayConfig(dict: overlayConfig) } }
    
    //new separate prop
    @objc var isFavourite: Bool = false {
        didSet {
            jsPlayerView?.isFavourite = isFavourite
            jsProps.isFavourite.value = isFavourite
        }
    }
    
    //new separate prop
    @objc var controls: Bool = false {
        didSet {
            jsPlayerView?.controls = controls
            jsProps.controls.value = controls
        }
    }

    //new separate prop
    @objc var paused: Bool = false {
        didSet {
            jsPlayerView?.isPaused = paused
        }
    }

    @objc var nowPlaying: NSDictionary? {
        didSet {
            jsPlayerView?.nowPlaying = nowPlaying
            jsProps.nowPlaying.value = try? JSNowPlaying(dict: nowPlaying)
        }
    }
    
    @objc var hideAdUiElements: Bool = false {
        didSet {
            jsProps.hideAdUiElements.value = hideAdUiElements
        }
    }
    
    @objc var isWhyThisAdIconEnabled: Bool = false {
        didSet {
            jsProps.isWhyThisAdIconEnabled.value = isWhyThisAdIconEnabled
        }
    }
    
    //FIXME: review unused variables
    @objc var selectedTextTrack: NSDictionary?
    @objc var selectedAudioTrack: NSDictionary?
    @objc var seek: NSDictionary?
    @objc var playNextSource: NSDictionary?
    @objc var playlist: NSDictionary?
    @objc var annotations: NSArray?
    @objc var playNextSourceTimeoutMillis: NSNumber?
    @objc var resizeMode: NSString?
    @objc var textTracks: NSArray?
    @objc var ignoreSilentSwitch: NSString?
    @objc var volume: NSNumber?
    @objc var rate: NSNumber?
    @objc var currentTime: NSNumber?
    @objc var progressUpdateInterval: NSNumber?

    @objc var isFullScreen: Bool = false
    @objc var allowAirplay: Bool = false
    @objc var isAnnotationsOn: Bool = false
    @objc var isStatsOpen: Bool = false
    @objc var isJSOverlayShown: Bool = false
    @objc var canMinimise: Bool = false
    @objc var allowsExternalPlayback: Bool = false
    @objc var muted: Bool = false
    @objc var playInBackground: Bool = true
    @objc var playWhenInactive: Bool = true
    @objc var fullscreen: Bool = false
    @objc var `repeat`: Bool = false
    
    var jsProps = JSProps()
    var jsPlayerView: RNDReactNativeDiceVideo.JSPlayerView?
    
    func seekToNow() {
        jsPlayerView?.seekNow()
    }
    
    func seekToTimestamp(isoDate: String) {
        jsPlayerView?.seek(isoDate)
    }
    
    //TODO: pass this value as part of source
    func seekToPosition(position: Double) {
        jsPlayerView?.seek(position)
    }
    
    func replaceAdTagParameters(adTagParameters: [String: Any], validFrom: Date?, validUntil: Date?) {            jsPlayerView?.replaceAdTagParameters(adTagParameters: adTagParameters, validFrom: validFrom, validUntil: validUntil)
    }

    private func setupDoris() {
        guard let jsBridge = self.jsBridge else { return }
        
        let rndvJSProps = PlayerViewProxy.convertRNVideoJSPropsToRNDV(jsProps: self.jsProps)
        let jsPlayerView = RNDReactNativeDiceVideo.JSPlayerView(overlayBuilder: RNVJSOverlayBuilder(bridge: jsBridge), jsProps: rndvJSProps)
        self.addSubview(jsPlayerView)
        
        jsPlayerView.onVideoProgress = self.onVideoProgress
        jsPlayerView.onBackButton = self.onBackButton
        jsPlayerView.onVideoError = self.onVideoError
        jsPlayerView.onRequireAdParameters = self.onRequireAdParameters
        jsPlayerView.onVideoLoad = self.onVideoLoad
        jsPlayerView.onSubtitleTrackChanged = self.onSubtitleTrackChanged
        jsPlayerView.onAudioTrackChanged = self.onAudioTrackChanged
        
        //api diff
        jsPlayerView.onRequestPlayNextSource = self.onRelatedVideoClicked
        jsPlayerView.onVideoEnded = self.onVideoEnd
        jsPlayerView.onVideoPaused = self.onPlaybackRateChange
        
        //new props
        jsPlayerView.onFavouriteButtonClick = self.onFavouriteButtonClick
        jsPlayerView.onRelatedVideosIconClicked = self.onRelatedVideosIconClicked
        jsPlayerView.onStatsIconClick = self.onStatsIconClick
        jsPlayerView.onEpgIconClick = self.onEpgIconClick
        jsPlayerView.onAnnotationsButtonClick = self.onAnnotationsButtonClick
        jsPlayerView.onWatchlistButtonClick = self.onWatchlistButtonClick
        jsPlayerView.onVideoBuffer = self.onVideoBuffer
        jsPlayerView.onVideoAboutToEnd = self.onVideoAboutToEnd
        
        jsPlayerView.translatesAutoresizingMaskIntoConstraints = false
        jsPlayerView.leftAnchor.constraint(equalTo: self.leftAnchor, constant: 0).isActive = true
        jsPlayerView.rightAnchor.constraint(equalTo: self.rightAnchor, constant: 0).isActive = true
        jsPlayerView.topAnchor.constraint(equalTo: self.topAnchor, constant: 0).isActive = true
        jsPlayerView.bottomAnchor.constraint(equalTo: self.bottomAnchor, constant: 0).isActive = true
        
        self.jsPlayerView = jsPlayerView
      
        self.jsProps.startAt = Dynamic(nil)
    }
    
    //moved to source
    func setInitialSeek(position: Double) {
        jsProps.startAt.value = position
    }
    
    //moved to source
    func setupLimitedSeekableRange(with range: Source.LimitedSeekableRange?) {
        let start = Date(timeIntervalSince1970InMilliseconds: range?.start)
        let end = Date(timeIntervalSince1970InMilliseconds: range?.end)
        
        if let end = end, end > Date() {
            //avoid finishing playback when ongoing live program reaches its end
            jsPlayerView?.dorisGlue?.doris?.player.setLimitedSeekableRange(range: (start: start, end: nil))
        } else {
            jsPlayerView?.dorisGlue?.doris?.player.setLimitedSeekableRange(range: (start: start, end: end))
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        if jsPlayerView == nil {
            setupDoris()
        }
    }
}
