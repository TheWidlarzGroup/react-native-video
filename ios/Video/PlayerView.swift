//
//  RNPlayerView.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 05.03.2021.
//

import AVDoris
import AVKit

class PlayerView: UIView, JSInputProtocol {
    var jsBridge: RCTBridge?
    //Events
    @objc var onBackButton: RCTBubblingEventBlock?
    @objc var onVideoLoadStart: RCTBubblingEventBlock?
    @objc var onVideoLoad: RCTBubblingEventBlock?
    @objc var onVideoBuffer: RCTBubblingEventBlock?
    @objc var onVideoError: RCTBubblingEventBlock?
    @objc var onVideoProgress: RCTBubblingEventBlock?
    @objc var onVideoSeek: RCTBubblingEventBlock?
    @objc var onVideoEnd: RCTBubblingEventBlock?
    @objc var onTimedMetadata: RCTBubblingEventBlock?
    @objc var onVideoAudioBecomingNoisy: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerWillPresent: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerDidPresent: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerWillDismiss: RCTBubblingEventBlock?
    @objc var onVideoFullscreenPlayerDidDismiss: RCTBubblingEventBlock?
    @objc var onReadyForDisplay: RCTBubblingEventBlock?
    @objc var onPlaybackStalled: RCTBubblingEventBlock?
    @objc var onPlaybackResume: RCTBubblingEventBlock?
    @objc var onPlaybackRateChange: RCTBubblingEventBlock?
    @objc var onRequireAdParameters: RCTBubblingEventBlock?
    @objc var onVideoAboutToEnd: RCTBubblingEventBlock?
    @objc var onFavouriteButtonClick: RCTBubblingEventBlock?
    @objc var onRelatedVideoClicked: RCTBubblingEventBlock?
    @objc var onRelatedVideosIconClicked: RCTBubblingEventBlock?
    @objc var onStatsIconClick: RCTBubblingEventBlock?
    @objc var onEpgIconClick: RCTBubblingEventBlock?
    @objc var onAnnotationsButtonClick: RCTBubblingEventBlock?
    
    //Props
    //MARK: Differs (source)
    @objc var src: NSDictionary? {
        didSet {
            if let source = try? Source(dict: src), source.uri.absoluteString != jsProps.source.value?.uri.absoluteString {                
                jsProps.source.value = try? Source(dict: src)
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
    @objc var isFavourite: Bool = false {
        didSet { jsProps.isFavourite.value = isFavourite } }
    @objc var controls: Bool = false {
        didSet { jsProps.controls.value = controls } }
    @objc var nowPlaying: NSDictionary? {
        didSet { jsProps.nowPlaying.value = try? JSNowPlaying(dict: nowPlaying) } }
    

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
    @objc var paused: Bool = false {
        didSet { paused ? jsDoris?.doris?.player.pause() : jsDoris?.doris?.player.play() }
    }
    var jsDoris: JSDoris?
    var jsProps = JSProps()
    
    func seekToNow() {
        //TODO
    }
    
    func seekToTimestamp(isoDate: String) {
        //TODO
    }
    
    //TODO: pass this value as part of source
    func seekToPosition(position: Double) {
        jsDoris?.doris?.player.seek(.position(position))
    }
    
    func replaceAdTagParameters(payload: NSDictionary) {
        jsDoris?.replaceAdTagParameters(parameters: AdTagParameters(payload: payload),
                                        extraInfo: AdTagParametersModifierInfo(viewWidth: frame.width,
                                                                               viewHeight: frame.height))
    }
    
    private func setupDoris() {
        jsDoris = JSDorisFactory.build(jsProps: jsProps,
                                       containerView: self,
                                       jsInput: self,
                                       bridge: jsBridge)
        
        jsDoris?.setup(with: jsProps)
    }
    
    func setInitialSeek(position: Double) {
        jsProps.startAt.value = position
    }
    
    func setupLimitedSeekableRange(with range: Source.LimitedSeekableRange?) {
        jsDoris?.setupLimitedSeekableRange(with: range)
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        if jsDoris == nil {
            setupDoris()
        }
    }
}
