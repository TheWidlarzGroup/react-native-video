import AVFoundation
import AVKit
import Foundation

@objc
protocol RCTPlayerObserverHandlerObjc {
    func handleDidFailToFinishPlaying(notification:NSNotification!)
    func handlePlaybackStalled(notification:NSNotification!)
    func handlePlayerItemDidReachEnd(notification:NSNotification!)
    // unused
//    func handleAVPlayerAccess(notification:NSNotification!)
}

protocol RCTPlayerObserverHandler: RCTPlayerObserverHandlerObjc {
    func handleTimeUpdate(time:CMTime)
    func handleReadyForDisplay(changeObject: Any, change:NSKeyValueObservedChange<Bool>)
    func handleTimeMetadataChange(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<[AVMetadataItem]?>)
    func handlePlayerItemStatusChange(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<AVPlayerItem.Status>)
    func handlePlaybackBufferKeyEmpty(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<Bool>)
    func handlePlaybackLikelyToKeepUp(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<Bool>)
    func handlePlaybackRateChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>)
    func handleExternalPlaybackActiveChange(player: AVPlayer, change: NSKeyValueObservedChange<Bool>)
    func handleViewControllerOverlayViewFrameChange(overlayView:UIView, change:NSKeyValueObservedChange<CGRect>)
}

class RCTPlayerObserver: NSObject {

    weak var _handlers: RCTPlayerObserverHandler?
    
    var player:AVPlayer? {
        willSet {
            removePlayerObservers()
            removePlayerTimeObserver()
        }
        didSet {
            if player != nil {
                addPlayerObservers()
                addPlayerTimeObserver()
            }
        }
    }
    var playerItem:AVPlayerItem? {
        willSet {
            removePlayerItemObservers()
        }
        didSet {
            if playerItem != nil {
                addPlayerItemObservers()
            }
        }
    }
    var playerViewController:AVPlayerViewController? {
        willSet {
            removePlayerViewControllerObservers()
        }
        didSet {
            if playerViewController != nil {
                addPlayerViewControllerObservers()
            }
        }
    }
    var playerLayer:AVPlayerLayer? {
        willSet {
            removePlayerLayerObserver()
        }
        didSet {
            if playerLayer != nil {
                addPlayerLayerObserver()
            }
        }
    }
    
    private var _progressUpdateInterval:TimeInterval = 250
    private var _timeObserver:Any?
    
    private var _playerRateChangeObserver:NSKeyValueObservation?
    private var _playerExpernalPlaybackActiveObserver:NSKeyValueObservation?
    private var _playerItemStatusObserver:NSKeyValueObservation?
    private var _playerPlaybackBufferEmptyObserver:NSKeyValueObservation?
    private var _playerPlaybackLikelyToKeepUpObserver:NSKeyValueObservation?
    private var _playerTimedMetadataObserver:NSKeyValueObservation?
    private var _playerViewControllerReadyForDisplayObserver:NSKeyValueObservation?
    private var _playerLayerReadyForDisplayObserver:NSKeyValueObservation?
    private var _playerViewControllerOverlayFrameObserver:NSKeyValueObservation?
    
    deinit {
        if let _handlers = _handlers {
            NotificationCenter.default.removeObserver(_handlers)
        }
    }
    
    func addPlayerObservers() {
        guard let player = player, let _handlers = _handlers else {
            return
        }
        
        _playerRateChangeObserver = player.observe(\.rate, changeHandler: _handlers.handlePlaybackRateChange)
        _playerExpernalPlaybackActiveObserver = player.observe(\.isExternalPlaybackActive, changeHandler: _handlers.handleExternalPlaybackActiveChange)
    }
    
    func removePlayerObservers() {
        _playerRateChangeObserver?.invalidate()
        _playerExpernalPlaybackActiveObserver?.invalidate()
    }
    
    func addPlayerItemObservers() {
        guard let playerItem = playerItem, let _handlers = _handlers else { return }

        _playerItemStatusObserver = playerItem.observe(\.status, options:  [.new, .old], changeHandler: _handlers.handlePlayerItemStatusChange)
        _playerPlaybackBufferEmptyObserver = playerItem.observe(\.isPlaybackBufferEmpty, options:  [.new, .old], changeHandler: _handlers.handlePlaybackBufferKeyEmpty)
        _playerPlaybackLikelyToKeepUpObserver = playerItem.observe(\.isPlaybackLikelyToKeepUp, options:  [.new, .old], changeHandler: _handlers.handlePlaybackLikelyToKeepUp)
        _playerTimedMetadataObserver = playerItem.observe(\.timedMetadata, options:  [.new], changeHandler: _handlers.handleTimeMetadataChange)
    }
    
    func removePlayerItemObservers() {
        _playerItemStatusObserver?.invalidate()
        _playerPlaybackBufferEmptyObserver?.invalidate()
        _playerPlaybackLikelyToKeepUpObserver?.invalidate()
        _playerTimedMetadataObserver?.invalidate()
    }

    func addPlayerViewControllerObservers() {
        guard let playerViewController = playerViewController, let _handlers = _handlers else { return }
        
        _playerViewControllerReadyForDisplayObserver = playerViewController.observe(\.isReadyForDisplay, options:  [.new], changeHandler: _handlers.handleReadyForDisplay)
        
        _playerViewControllerOverlayFrameObserver = playerViewController.contentOverlayView?.observe(\.frame, options:  [.new, .old], changeHandler: _handlers.handleViewControllerOverlayViewFrameChange)
    }
    
    func removePlayerViewControllerObservers() {
        _playerViewControllerReadyForDisplayObserver?.invalidate()
        _playerViewControllerOverlayFrameObserver?.invalidate()
    }
    
    func addPlayerLayerObserver() {
        guard let _handlers = _handlers else {return}
        _playerLayerReadyForDisplayObserver = playerLayer?.observe(\.isReadyForDisplay, options:  [.new], changeHandler: _handlers.handleReadyForDisplay)
    }
    
    func removePlayerLayerObserver() {
        _playerLayerReadyForDisplayObserver?.invalidate()
    }
    
    func addPlayerTimeObserver() {
        guard let _handlers = _handlers else {return}
        removePlayerTimeObserver()
        let progressUpdateIntervalMS:Float64 = _progressUpdateInterval / 1000
        // @see endScrubbing in AVPlayerDemoPlaybackViewController.m
        // of https://developer.apple.com/library/ios/samplecode/AVPlayerDemo/Introduction/Intro.html
        _timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTimeMakeWithSeconds(progressUpdateIntervalMS, preferredTimescale: Int32(NSEC_PER_SEC)),
            queue:nil,
            using:_handlers.handleTimeUpdate
        )
    }
    
    /* Cancels the previously registered time observer. */
    func removePlayerTimeObserver() {
        if _timeObserver != nil {
            player?.removeTimeObserver(_timeObserver)
            _timeObserver = nil
        }
    }
    
    func addTimeObserverIfNotSet() {
        if (_timeObserver == nil) {
            addPlayerTimeObserver()
        }
    }
    
    func replaceTimeObserverIfSet(_ newUpdateInterval:Float64? = nil) {
        if let newUpdateInterval = newUpdateInterval {
            _progressUpdateInterval = newUpdateInterval
        }
        if (_timeObserver != nil) {
            addPlayerTimeObserver()
        }
    }
    
    func attachPlayerEventListeners() {
        guard let _handlers = _handlers else {return}

        NotificationCenter.default.removeObserver(_handlers,
                                                  name:NSNotification.Name.AVPlayerItemDidPlayToEndTime,
                                                  object:player?.currentItem)
        NotificationCenter.default.addObserver(_handlers,
                                               selector:#selector(RCTPlayerObserverHandler.handlePlayerItemDidReachEnd(notification:)),
                                               name:NSNotification.Name.AVPlayerItemDidPlayToEndTime,
                                               object:player?.currentItem)
        
        NotificationCenter.default.removeObserver(_handlers,
                                                  name:NSNotification.Name.AVPlayerItemPlaybackStalled,
                                                  object:nil)
        NotificationCenter.default.addObserver(_handlers,
                                               selector:#selector(RCTPlayerObserverHandler.handlePlaybackStalled(notification:)),
                                               name:NSNotification.Name.AVPlayerItemPlaybackStalled,
                                               object:nil)
        NotificationCenter.default.removeObserver(_handlers,
                                                  name: NSNotification.Name.AVPlayerItemFailedToPlayToEndTime,
                                                  object:nil)
        NotificationCenter.default.addObserver(_handlers,
                                               selector:#selector(RCTPlayerObserverHandler.handleDidFailToFinishPlaying(notification:)),
                                               name: NSNotification.Name.AVPlayerItemFailedToPlayToEndTime,
                                               object:nil)
    }
    
    func clearPlayer() {
        player = nil
        playerItem = nil
        if let _handlers = _handlers {
            NotificationCenter.default.removeObserver(_handlers)
        }
    }
}
