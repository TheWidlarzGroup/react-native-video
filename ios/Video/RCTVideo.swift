import AVFoundation
import AVKit
import Foundation
#if USE_GOOGLE_IMA
import GoogleInteractiveMediaAds
#endif
import React
import Promises

class RCTVideo: UIView, RCTVideoPlayerViewControllerDelegate, RCTPlayerObserverHandler {

    private var _player:AVPlayer?
    private var _playerItem:AVPlayerItem?
    private var _source:VideoSource?
    private var _playerBufferEmpty:Bool = true
    private var _playerLayer:AVPlayerLayer?

    private var _playerViewController:RCTVideoPlayerViewController?
    private var _videoURL:NSURL?

    /* DRM */
    private var _drm:DRMParams?

    private var _localSourceEncryptionKeyScheme:String?

    /* Required to publish events */
    private var _eventDispatcher:RCTEventDispatcher?
    private var _videoLoadStarted:Bool = false

    private var _pendingSeek:Bool = false
    private var _pendingSeekTime:Float = 0.0
    private var _lastSeekTime:Float = 0.0

    /* For sending videoProgress events */
    private var _controls:Bool = false

    /* Keep track of any modifiers, need to be applied after each play */
    private var _volume:Float = 1.0
    private var _rate:Float = 1.0
    private var _maxBitRate:Float?

    private var _automaticallyWaitsToMinimizeStalling:Bool = true
    private var _muted:Bool = false
    private var _paused:Bool = false
    private var _repeat:Bool = false
    private var _allowsExternalPlayback:Bool = true
    private var _textTracks:[TextTrack]?
    private var _selectedTextTrackCriteria:SelectedTrackCriteria?
    private var _selectedAudioTrackCriteria:SelectedTrackCriteria?
    private var _playbackStalled:Bool = false
    private var _playInBackground:Bool = false
    private var _preventsDisplaySleepDuringVideoPlayback:Bool = true
    private var _preferredForwardBufferDuration:Float = 0.0
    private var _playWhenInactive:Bool = false
    private var _ignoreSilentSwitch:String! = "inherit" // inherit, ignore, obey
    private var _mixWithOthers:String! = "inherit" // inherit, mix, duck
    private var _resizeMode:String! = "AVLayerVideoGravityResizeAspectFill"
    private var _fullscreen:Bool = false
    private var _fullscreenAutorotate:Bool = true
    private var _fullscreenOrientation:String! = "all"
    private var _fullscreenPlayerPresented:Bool = false
    private var _fullscreenUncontrolPlayerPresented:Bool = false // to call events switching full screen mode from player controls
    private var _filterName:String!
    private var _filterEnabled:Bool = false
    private var _presentingViewController:UIViewController?

    /* IMA Ads */
    private var _adTagUrl:String?
#if USE_GOOGLE_IMA
    private var _imaAdsManager: RCTIMAAdsManager!
    /* Playhead used by the SDK to track content video progress and insert mid-rolls. */
    private var _contentPlayhead: IMAAVPlayerContentPlayhead?
#endif
    private var _didRequestAds:Bool = false
    private var _adPlaying:Bool = false

    private var _resouceLoaderDelegate: RCTResourceLoaderDelegate?
    private var _playerObserver: RCTPlayerObserver = RCTPlayerObserver()

#if canImport(RCTVideoCache)
    private let _videoCache:RCTVideoCachingHandler = RCTVideoCachingHandler()
#endif

#if TARGET_OS_IOS
    private let _pip:RCTPictureInPicture = RCTPictureInPicture(self.onPictureInPictureStatusChanged, self.onRestoreUserInterfaceForPictureInPictureStop)
#endif

    // Events
    @objc var onVideoLoadStart: RCTDirectEventBlock?
    @objc var onVideoLoad: RCTDirectEventBlock?
    @objc var onVideoBuffer: RCTDirectEventBlock?
    @objc var onVideoError: RCTDirectEventBlock?
    @objc var onVideoProgress: RCTDirectEventBlock?
    @objc var onBandwidthUpdate: RCTDirectEventBlock?
    @objc var onVideoSeek: RCTDirectEventBlock?
    @objc var onVideoEnd: RCTDirectEventBlock?
    @objc var onTimedMetadata: RCTDirectEventBlock?
    @objc var onVideoAudioBecomingNoisy: RCTDirectEventBlock?
    @objc var onVideoFullscreenPlayerWillPresent: RCTDirectEventBlock?
    @objc var onVideoFullscreenPlayerDidPresent: RCTDirectEventBlock?
    @objc var onVideoFullscreenPlayerWillDismiss: RCTDirectEventBlock?
    @objc var onVideoFullscreenPlayerDidDismiss: RCTDirectEventBlock?
    @objc var onReadyForDisplay: RCTDirectEventBlock?
    @objc var onPlaybackStalled: RCTDirectEventBlock?
    @objc var onPlaybackResume: RCTDirectEventBlock?
    @objc var onPlaybackRateChange: RCTDirectEventBlock?
    @objc var onVideoExternalPlaybackChange: RCTDirectEventBlock?
    @objc var onPictureInPictureStatusChanged: RCTDirectEventBlock?
    @objc var onRestoreUserInterfaceForPictureInPictureStop: RCTDirectEventBlock?
    @objc var onGetLicense: RCTDirectEventBlock?
    @objc var onReceiveAdEvent: RCTDirectEventBlock?

    init(eventDispatcher:RCTEventDispatcher!) {
        super.init(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
#if USE_GOOGLE_IMA
        _imaAdsManager = RCTIMAAdsManager(video: self)
#endif

        _eventDispatcher = eventDispatcher

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillResignActive(notification:)),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidEnterBackground(notification:)),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillEnterForeground(notification:)),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioRouteChanged(notification:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
        _playerObserver._handlers = self
#if canImport(RCTVideoCache)
        _videoCache.playerItemPrepareText = playerItemPrepareText
#endif
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
#if USE_GOOGLE_IMA
        _imaAdsManager = RCTIMAAdsManager(video: self)
#endif
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        self.removePlayerLayer()
        _playerObserver.clearPlayer()
    }

    // MARK: - App lifecycle handlers

    @objc func applicationWillResignActive(notification:NSNotification!) {
        if _playInBackground || _playWhenInactive || _paused {return}

        _player?.pause()
        _player?.rate = 0.0
    }

    @objc func applicationDidEnterBackground(notification:NSNotification!) {
        if _playInBackground {
            // Needed to play sound in background. See https://developer.apple.com/library/ios/qa/qa1668/_index.html
            _playerLayer?.player = nil
            _playerViewController?.player = nil
        }
    }

    @objc func applicationWillEnterForeground(notification:NSNotification!) {
        self.applyModifiers()
        if _playInBackground {
            _playerLayer?.player = _player
            _playerViewController?.player = _player
        }
    }

    // MARK: - Audio events

    @objc func audioRouteChanged(notification:NSNotification!) {
        if let userInfo = notification.userInfo {
            let reason:AVAudioSession.RouteChangeReason! = userInfo[AVAudioSessionRouteChangeReasonKey] as? AVAudioSession.RouteChangeReason
            //            let previousRoute:NSNumber! = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? NSNumber
            if reason == .oldDeviceUnavailable, let onVideoAudioBecomingNoisy = onVideoAudioBecomingNoisy {
                onVideoAudioBecomingNoisy(["target": reactTag as Any])
            }
        }
    }

    // MARK: - Progress

    func sendProgressUpdate() {
        if let video = _player?.currentItem,
           video == nil || video.status != AVPlayerItem.Status.readyToPlay {
            return
        }

        let playerDuration:CMTime = RCTVideoUtils.playerItemDuration(_player)
        if CMTIME_IS_INVALID(playerDuration) {
            return
        }

        var currentTime = _player?.currentTime()
        if (currentTime != nil && _source?.startTime != nil) {
            currentTime = CMTimeSubtract(currentTime!, CMTimeMake(value: _source?.startTime ?? 0, timescale: 1000))
        }
        let currentPlaybackTime = _player?.currentItem?.currentDate()
        let duration = CMTimeGetSeconds(playerDuration)
        let currentTimeSecs = CMTimeGetSeconds(currentTime ?? .zero)

        NotificationCenter.default.post(name: NSNotification.Name("RCTVideo_progress"), object: nil, userInfo: [
            "progress": NSNumber(value: currentTimeSecs / duration)
        ])

        if currentTimeSecs >= 0 {
#if USE_GOOGLE_IMA
            if !_didRequestAds && currentTimeSecs >= 0.0001 && _adTagUrl != nil {
                _imaAdsManager.requestAds()
                _didRequestAds = true
            }
#endif
            onVideoProgress?([
                "currentTime": NSNumber(value: Float(currentTimeSecs)),
                "playableDuration": RCTVideoUtils.calculatePlayableDuration(_player, withSource: _source),
                "atValue": NSNumber(value: currentTime?.value ?? .zero),
                "currentPlaybackTime": NSNumber(value: NSNumber(value: floor(currentPlaybackTime?.timeIntervalSince1970 ?? 0 * 1000)).int64Value),
                "target": reactTag,
                "seekableDuration": RCTVideoUtils.calculateSeekableDuration(_player)
            ])
        }
    }

    // MARK: - Player and source
    @objc
    func setSrc(_ source:NSDictionary!) {
        DispatchQueue.global(qos: .default).async { [weak self] in
            guard let self = self else {return}
            self._source = VideoSource(source)
            if (self._source?.uri == nil || self._source?.uri == "") {
                self._player?.replaceCurrentItem(with: nil)
                return;
            }
            self.removePlayerLayer()
            self._playerObserver.player = nil
            self._resouceLoaderDelegate = nil
            self._playerObserver.playerItem = nil

            // perform on next run loop, otherwise other passed react-props may not be set
            RCTVideoUtils.delay()
                .then{ [weak self] in
                    guard let self = self else {throw NSError(domain: "", code: 0, userInfo: nil)}
                    guard let source = self._source else {
                        DebugLog("The source not exist")
                        throw NSError(domain: "", code: 0, userInfo: nil)
                    }
                    if let uri = source.uri, uri.starts(with: "ph://") {
                        return Promise {
                            RCTVideoUtils.preparePHAsset(uri: uri).then { asset in
                                return self.playerItemPrepareText(asset:asset, assetOptions:nil)
                            }
                        }
                    }
                    guard let assetResult = RCTVideoUtils.prepareAsset(source: source),
                        let asset = assetResult.asset,
                        let assetOptions = assetResult.assetOptions else {
                        DebugLog("Could not find video URL in source '\(self._source)'")
                        throw NSError(domain: "", code: 0, userInfo: nil)
                    }

    #if canImport(RCTVideoCache)
                    if self._videoCache.shouldCache(source:source, textTracks:self._textTracks) {
                        return self._videoCache.playerItemForSourceUsingCache(uri: source.uri, assetOptions:assetOptions)
                    }
    #endif

                    if self._drm != nil || self._localSourceEncryptionKeyScheme != nil {
                        self._resouceLoaderDelegate = RCTResourceLoaderDelegate(
                            asset: asset,
                            drm: self._drm,
                            localSourceEncryptionKeyScheme: self._localSourceEncryptionKeyScheme,
                            onVideoError: self.onVideoError,
                            onGetLicense: self.onGetLicense,
                            reactTag: self.reactTag
                        )
                    }
                    return Promise{self.playerItemPrepareText(asset: asset, assetOptions:assetOptions)}
                }.then{[weak self] (playerItem:AVPlayerItem!) in
                    guard let self = self else {throw  NSError(domain: "", code: 0, userInfo: nil)}

                    self._player?.pause()
                    self._playerItem = playerItem
                    self._playerObserver.playerItem = self._playerItem
                    self.setPreferredForwardBufferDuration(self._preferredForwardBufferDuration)
                    self.setPlaybackRange(playerItem, withVideoStart: self._source?.startTime, withVideoEnd: self._source?.endTime)
                    self.setFilter(self._filterName)
                    if let maxBitRate = self._maxBitRate {
                        self._playerItem?.preferredPeakBitRate = Double(maxBitRate)
                    }

                    self._player = self._player ?? AVPlayer()
                    self._player?.replaceCurrentItem(with: playerItem)
                    self._playerObserver.player = self._player
                    self.applyModifiers()
                    self._player?.actionAtItemEnd = .none

                    if #available(iOS 10.0, *) {
                        self.setAutomaticallyWaitsToMinimizeStalling(self._automaticallyWaitsToMinimizeStalling)
                    }

#if USE_GOOGLE_IMA
                    if self._adTagUrl != nil {
                        // Set up your content playhead and contentComplete callback.
                        self._contentPlayhead = IMAAVPlayerContentPlayhead(avPlayer: self._player!)

                        self._imaAdsManager.setUpAdsLoader()
                    }
#endif
                    //Perform on next run loop, otherwise onVideoLoadStart is nil
                    self.onVideoLoadStart?([
                        "src": [
                            "uri": self._source?.uri ?? NSNull(),
                            "type": self._source?.type ?? NSNull(),
                            "isNetwork": NSNumber(value: self._source?.isNetwork ?? false)
                        ],
                        "drm": self._drm?.json ?? NSNull(),
                        "target": self.reactTag
                    ])
                }.catch{_ in }
            self._videoLoadStarted = true
        }
    }

    @objc
    func setDrm(_ drm:NSDictionary) {
        _drm = DRMParams(drm)
    }

    @objc
    func setLocalSourceEncryptionKeyScheme(_ keyScheme:String) {
        _localSourceEncryptionKeyScheme = keyScheme
    }

    func playerItemPrepareText(asset:AVAsset!, assetOptions:NSDictionary?) -> AVPlayerItem {
        if (_textTracks == nil) || _textTracks?.count==0 {
            return AVPlayerItem(asset: asset)
        }

        // AVPlayer can't airplay AVMutableCompositions
        _allowsExternalPlayback = false
        let mixComposition = RCTVideoUtils.generateMixComposition(asset)
        let validTextTracks = RCTVideoUtils.getValidTextTracks(
            asset:asset,
            assetOptions:assetOptions,
            mixComposition:mixComposition,
            textTracks:_textTracks)
        if validTextTracks.count != _textTracks?.count {
            setTextTracks(validTextTracks)
        }

        return AVPlayerItem(asset: mixComposition)
    }

    // MARK: - Prop setters

    @objc
    func setResizeMode(_ mode: String?) {
        if _controls {
            _playerViewController?.videoGravity = AVLayerVideoGravity(rawValue: mode ?? "")
        } else {
            _playerLayer?.videoGravity = AVLayerVideoGravity(rawValue: mode ?? "")
        }
        _resizeMode = mode
    }

    @objc
    func setPlayInBackground(_ playInBackground:Bool) {
        _playInBackground = playInBackground
    }

    @objc
    func setPreventsDisplaySleepDuringVideoPlayback(_ preventsDisplaySleepDuringVideoPlayback:Bool) {
        _preventsDisplaySleepDuringVideoPlayback = preventsDisplaySleepDuringVideoPlayback
        self.applyModifiers()
    }

    @objc
    func setAllowsExternalPlayback(_ allowsExternalPlayback:Bool) {
        _allowsExternalPlayback = allowsExternalPlayback
        _player?.allowsExternalPlayback = _allowsExternalPlayback
    }

    @objc
    func setPlayWhenInactive(_ playWhenInactive:Bool) {
        _playWhenInactive = playWhenInactive
    }

    @objc
    func setPictureInPicture(_ pictureInPicture:Bool) {
#if TARGET_OS_IOS
        _pip.setPictureInPicture(pictureInPicture)
#endif
    }

    @objc
    func setRestoreUserInterfaceForPIPStopCompletionHandler(_ restore:Bool) {
#if TARGET_OS_IOS
        _pip.setRestoreUserInterfaceForPIPStopCompletionHandler(restore)
#endif
    }

    @objc
    func setIgnoreSilentSwitch(_ ignoreSilentSwitch:String?) {
        _ignoreSilentSwitch = ignoreSilentSwitch
        RCTPlayerOperations.configureAudio(ignoreSilentSwitch:_ignoreSilentSwitch, mixWithOthers:_mixWithOthers)
        applyModifiers()
    }

    @objc
    func setMixWithOthers(_ mixWithOthers:String?) {
        _mixWithOthers = mixWithOthers
        applyModifiers()
    }

    @objc
    func setPaused(_ paused:Bool) {
        if paused {
            if _adPlaying {
#if USE_GOOGLE_IMA
                _imaAdsManager.getAdsManager()?.pause()
#endif
            } else {
                _player?.pause()
                _player?.rate = 0.0
            }
        } else {
            RCTPlayerOperations.configureAudio(ignoreSilentSwitch:_ignoreSilentSwitch, mixWithOthers:_mixWithOthers)

            if _adPlaying {
#if USE_GOOGLE_IMA
                _imaAdsManager.getAdsManager()?.resume()
#endif
            } else {
                if #available(iOS 10.0, *), !_automaticallyWaitsToMinimizeStalling {
                    _player?.playImmediately(atRate: _rate)
                } else {
                    _player?.play()
                    _player?.rate = _rate
                }
                _player?.rate = _rate
            }
        }

        _paused = paused
    }

    @objc
    func setSeek(_ info:NSDictionary!) {
        let seekTime:NSNumber! = info["time"] as! NSNumber
        let seekTolerance:NSNumber! = info["tolerance"] as! NSNumber
        let item:AVPlayerItem? = _player?.currentItem
        guard item != nil, let player = _player, let item = item, item.status == AVPlayerItem.Status.readyToPlay else {
            _pendingSeek = true
            _pendingSeekTime = seekTime.floatValue
            return
        }
        let wasPaused = _paused

        RCTPlayerOperations.seek(
            player:player,
            playerItem:item,
            paused:wasPaused,
            seekTime:seekTime.floatValue,
            seekTolerance:seekTolerance.floatValue)
            .then{ [weak self] (finished:Bool) in
                guard let self = self else { return }

                self._playerObserver.addTimeObserverIfNotSet()
                if !wasPaused {
                    self.setPaused(false)
                }
                self.onVideoSeek?(["currentTime": NSNumber(value: Float(CMTimeGetSeconds(item.currentTime()))),
                                   "seekTime": seekTime,
                                   "target": self.reactTag])
            }.catch{_ in }

        _pendingSeek = false
    }

    @objc
    func setRate(_ rate:Float) {
        _rate = rate
        applyModifiers()
    }

    @objc
    func isMuted() -> Bool {
        return _muted
    }

    @objc
    func setMuted(_ muted:Bool) {
        _muted = muted
        applyModifiers()
    }

    @objc
    func setVolume(_ volume:Float) {
        _volume = volume
        applyModifiers()
    }

    @objc
    func setMaxBitRate(_ maxBitRate:Float) {
        _maxBitRate = maxBitRate
        _playerItem?.preferredPeakBitRate = Double(maxBitRate)
    }

    @objc
    func setPreferredForwardBufferDuration(_ preferredForwardBufferDuration:Float) {
        _preferredForwardBufferDuration = preferredForwardBufferDuration
        if #available(iOS 10.0, *) {
            _playerItem?.preferredForwardBufferDuration = TimeInterval(preferredForwardBufferDuration)
        } else {
            // Fallback on earlier versions
        }
    }

    @objc
    func setAutomaticallyWaitsToMinimizeStalling(_ waits:Bool) {
        _automaticallyWaitsToMinimizeStalling = waits
        if #available(iOS 10.0, *) {
            _player?.automaticallyWaitsToMinimizeStalling = waits
        } else {
            // Fallback on earlier versions
        }
    }
    
    func setPlaybackRange(_ item:AVPlayerItem!, withVideoStart videoStart:Int64?, withVideoEnd videoEnd:Int64?) {
        if (videoStart != nil) {
            let start = CMTimeMake(value: videoStart!, timescale: 1000)
            item.reversePlaybackEndTime = start
            _pendingSeekTime = Float(CMTimeGetSeconds(start))
            _pendingSeek = true
        }
        if (videoEnd != nil) {
            item.forwardPlaybackEndTime = CMTimeMake(value: videoEnd!, timescale: 1000)
        }
    }


    func applyModifiers() {
        if let video = _player?.currentItem,
            video == nil || video.status != AVPlayerItem.Status.readyToPlay {
            return
        }
        if _muted {
            if !_controls {
                _player?.volume = 0
            }
            _player?.isMuted = true
        } else {
            _player?.volume = _volume
            _player?.isMuted = false
        }

        if #available(iOS 12.0, *) {
            _player?.preventsDisplaySleepDuringVideoPlayback = _preventsDisplaySleepDuringVideoPlayback
        } else {
            // Fallback on earlier versions
        }

        if let _maxBitRate = _maxBitRate {
            setMaxBitRate(_maxBitRate)
        }

        setSelectedAudioTrack(_selectedAudioTrackCriteria)
        setSelectedTextTrack(_selectedTextTrackCriteria)
        setResizeMode(_resizeMode)
        setRepeat(_repeat)
        setControls(_controls)
        setPaused(_paused)
        setAllowsExternalPlayback(_allowsExternalPlayback)
    }

    @objc
    func setRepeat(_ `repeat`: Bool) {
        _repeat = `repeat`
    }



    @objc
    func setSelectedAudioTrack(_ selectedAudioTrack:NSDictionary?) {
        setSelectedAudioTrack(SelectedTrackCriteria(selectedAudioTrack))
    }

    func setSelectedAudioTrack(_ selectedAudioTrack:SelectedTrackCriteria?) {
        _selectedAudioTrackCriteria = selectedAudioTrack
        RCTPlayerOperations.setMediaSelectionTrackForCharacteristic(player:_player, characteristic: AVMediaCharacteristic.audible,
                                                                    criteria:_selectedAudioTrackCriteria)
    }

    @objc
    func setSelectedTextTrack(_ selectedTextTrack:NSDictionary?) {
        setSelectedTextTrack(SelectedTrackCriteria(selectedTextTrack))
    }

    func setSelectedTextTrack(_ selectedTextTrack:SelectedTrackCriteria?) {
        _selectedTextTrackCriteria = selectedTextTrack
        if (_textTracks != nil) { // sideloaded text tracks
            RCTPlayerOperations.setSideloadedText(player:_player, textTracks:_textTracks, criteria:_selectedTextTrackCriteria)
        } else { // text tracks included in the HLS playlist
            RCTPlayerOperations.setMediaSelectionTrackForCharacteristic(player:_player, characteristic: AVMediaCharacteristic.legible,
                                                                        criteria:_selectedTextTrackCriteria)
        }
    }

    @objc
    func setTextTracks(_ textTracks:[NSDictionary]?) {
        setTextTracks(textTracks?.map { TextTrack($0) })
    }

    func setTextTracks(_ textTracks:[TextTrack]?) {
        _textTracks = textTracks

        // in case textTracks was set after selectedTextTrack
        if (_selectedTextTrackCriteria != nil) {setSelectedTextTrack(_selectedTextTrackCriteria)}
    }

    @objc
    func setFullscreen(_ fullscreen:Bool) {
        if fullscreen && !_fullscreenPlayerPresented && _player != nil {
            // Ensure player view controller is not null
            if _playerViewController == nil && _controls {
                self.usePlayerViewController()
            }

            // Set presentation style to fullscreen
            _playerViewController?.modalPresentationStyle = .fullScreen

            // Find the nearest view controller
            var viewController:UIViewController! = self.firstAvailableUIViewController()
            if (viewController == nil) {
                let keyWindow:UIWindow! = UIApplication.shared.keyWindow
                viewController = keyWindow.rootViewController
                if viewController.children.count > 0
                {
                    viewController = viewController.children.last
                }
            }
            if viewController != nil {
                _presentingViewController = viewController

                self.onVideoFullscreenPlayerWillPresent?(["target": reactTag as Any])

                if let playerViewController = _playerViewController {
                    if(_controls) {
                        // prevents crash https://github.com/react-native-video/react-native-video/issues/3040
                        self._playerViewController?.removeFromParent()
                    }

                    viewController.present(playerViewController, animated:true, completion:{ [weak self] in
                        guard let self = self else {return}
                        self._playerViewController?.showsPlaybackControls = self._controls
                        self._fullscreenPlayerPresented = fullscreen
                        self._playerViewController?.autorotate = self._fullscreenAutorotate

                        self.onVideoFullscreenPlayerDidPresent?(["target": self.reactTag])

                    })
                }
            }
        } else if !fullscreen && _fullscreenPlayerPresented, let _playerViewController = _playerViewController {
            self.videoPlayerViewControllerWillDismiss(playerViewController: _playerViewController)
            _presentingViewController?.dismiss(animated: true, completion:{[weak self] in
                self?.videoPlayerViewControllerDidDismiss(playerViewController: _playerViewController)
            })
        }
    }

    @objc
    func setFullscreenAutorotate(_ autorotate:Bool) {
        _fullscreenAutorotate = autorotate
        if _fullscreenPlayerPresented {
            _playerViewController?.autorotate = autorotate
        }
    }

    @objc
    func setFullscreenOrientation(_ orientation:String?) {
        _fullscreenOrientation = orientation
        if _fullscreenPlayerPresented {
            _playerViewController?.preferredOrientation = orientation
        }
    }

    func usePlayerViewController() {
        guard let _player = _player, let _playerItem = _playerItem else { return }

        if _playerViewController == nil {
            _playerViewController = createPlayerViewController(player:_player, withPlayerItem:_playerItem)
        }
        // to prevent video from being animated when resizeMode is 'cover'
        // resize mode must be set before subview is added
        setResizeMode(_resizeMode)

        guard let _playerViewController = _playerViewController else { return }

        if _controls {
            let viewController:UIViewController! = self.reactViewController()
            viewController?.addChild(_playerViewController)
            self.addSubview(_playerViewController.view)
        }

        _playerObserver.playerViewController = _playerViewController
    }

    func createPlayerViewController(player:AVPlayer, withPlayerItem playerItem:AVPlayerItem) -> RCTVideoPlayerViewController {
        let viewController = RCTVideoPlayerViewController()
        viewController.showsPlaybackControls = self._controls
        viewController.rctDelegate = self
        viewController.preferredOrientation = _fullscreenOrientation

        viewController.view.frame = self.bounds
        viewController.player = player
        return viewController
    }

    func usePlayerLayer() {
        if let _player = _player {
            _playerLayer = AVPlayerLayer(player: _player)
            _playerLayer?.frame = self.bounds
            _playerLayer?.needsDisplayOnBoundsChange = true

            // to prevent video from being animated when resizeMode is 'cover'
            // resize mode must be set before layer is added
            setResizeMode(_resizeMode)
            _playerObserver.playerLayer = _playerLayer

            if let _playerLayer = _playerLayer {
                self.layer.addSublayer(_playerLayer)
            }
            self.layer.needsDisplayOnBoundsChange = true
#if TARGET_OS_IOS
            _pip.setupPipController(_playerLayer)
#endif
        }
    }

    @objc
    func setControls(_ controls:Bool) {
        if _controls != controls || ((_playerLayer == nil) && (_playerViewController == nil))
        {
            _controls = controls
            if _controls
            {
                self.removePlayerLayer()
                self.usePlayerViewController()
            }
            else
            {
                _playerViewController?.view.removeFromSuperview()
                _playerViewController?.removeFromParent()
                _playerViewController = nil
                _playerObserver.playerViewController = nil
                self.usePlayerLayer()
            }
        }
    }

    @objc
    func setProgressUpdateInterval(_ progressUpdateInterval:Float) {
        _playerObserver.replaceTimeObserverIfSet(Float64(progressUpdateInterval))
    }

    func removePlayerLayer() {
        _playerLayer?.removeFromSuperlayer()
        _playerLayer = nil
        _playerObserver.playerLayer = nil
    }

    // MARK: - RCTVideoPlayerViewControllerDelegate

    func videoPlayerViewControllerWillDismiss(playerViewController:AVPlayerViewController) {
        if _playerViewController == playerViewController && _fullscreenPlayerPresented, let onVideoFullscreenPlayerWillDismiss = onVideoFullscreenPlayerWillDismiss {
            _playerObserver.removePlayerViewControllerObservers()
            onVideoFullscreenPlayerWillDismiss(["target": reactTag as Any])
        }
    }


    func videoPlayerViewControllerDidDismiss(playerViewController:AVPlayerViewController) {
        if _playerViewController == playerViewController && _fullscreenPlayerPresented {
            _fullscreenPlayerPresented = false
            _presentingViewController = nil
            _playerViewController = nil
            _playerObserver.playerViewController = nil
            self.applyModifiers()

            onVideoFullscreenPlayerDidDismiss?(["target": reactTag as Any])
        }
    }

    @objc
    func setFilter(_ filterName:String!) {
        _filterName = filterName

        if !_filterEnabled {
            return
        } else if let uri = _source?.uri, uri.contains("m3u8") {
            return // filters don't work for HLS... return
        } else if _playerItem?.asset == nil {
            return
        }

        let filter:CIFilter! = CIFilter(name: filterName)
        if #available(iOS 9.0, *), let _playerItem = _playerItem {
            self._playerItem?.videoComposition = AVVideoComposition(
                asset: _playerItem.asset,
                applyingCIFiltersWithHandler: { (request:AVAsynchronousCIImageFilteringRequest) in
                    if filter == nil {
                        request.finish(with: request.sourceImage, context:nil)
                    } else {
                        let image:CIImage! = request.sourceImage.clampedToExtent()
                        filter.setValue(image, forKey:kCIInputImageKey)
                        let output:CIImage! = filter.outputImage?.cropped(to: request.sourceImage.extent)
                        request.finish(with: output, context:nil)
                    }
                })
        } else {
            // Fallback on earlier versions
        }
    }

    @objc
    func setFilterEnabled(_ filterEnabled:Bool) {
        _filterEnabled = filterEnabled
    }

    // MARK: - RCTIMAAdsManager

    func getAdTagUrl() -> String? {
        return _adTagUrl
    }

    @objc
    func setAdTagUrl(_ adTagUrl:String!) {
        _adTagUrl = adTagUrl
    }
#if USE_GOOGLE_IMA
    func getContentPlayhead() -> IMAAVPlayerContentPlayhead? {
        return _contentPlayhead
    }
#endif
    func setAdPlaying(_ adPlaying:Bool) {
        _adPlaying = adPlaying
    }

    // MARK: - React View Management

    func insertReactSubview(view:UIView!, atIndex:Int) {
        if _controls {
            view.frame = self.bounds
            _playerViewController?.contentOverlayView?.insertSubview(view, at:atIndex)
        } else {
            RCTLogError("video cannot have any subviews")
        }
        return
    }

    func removeReactSubview(subview:UIView!) {
        if _controls {
            subview.removeFromSuperview()
        } else {
            RCTLog("video cannot have any subviews")
        }
        return
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if _controls, let _playerViewController = _playerViewController {
            _playerViewController.view.frame = bounds

            // also adjust all subviews of contentOverlayView
            for subview in _playerViewController.contentOverlayView?.subviews ?? [] {
                subview.frame = bounds
            }
        } else {
            CATransaction.begin()
            CATransaction.setAnimationDuration(0)
            _playerLayer?.frame = bounds
            CATransaction.commit()
        }
    }

    // MARK: - Lifecycle

    override func removeFromSuperview() {
        _player?.pause()
        _player = nil
        _resouceLoaderDelegate = nil
        _playerObserver.clearPlayer()

        self.removePlayerLayer()

        if let _playerViewController = _playerViewController {
            _playerViewController.view.removeFromSuperview()
            _playerViewController.removeFromParent()
            _playerViewController.rctDelegate = nil
            _playerViewController.player = nil
            self._playerViewController = nil
            _playerObserver.playerViewController = nil
        }

        _eventDispatcher = nil
        NotificationCenter.default.removeObserver(self)

        super.removeFromSuperview()
    }

    // MARK: - Export

    @objc
    func save(options:NSDictionary!, resolve: @escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        RCTVideoSave.save(
            options:options,
            resolve:resolve,
            reject:reject,
            playerItem:_playerItem
        )
    }

    func setLicenseResult(_ license:String!) {
        _resouceLoaderDelegate?.setLicenseResult(license)
    }

    func setLicenseResultError(_ error:String!) {
        _resouceLoaderDelegate?.setLicenseResultError(error)
    }

    // MARK: - RCTPlayerObserverHandler

    func handleTimeUpdate(time:CMTime) {
        sendProgressUpdate()
    }

    func handleReadyForDisplay(changeObject: Any, change:NSKeyValueObservedChange<Bool>) {
        onReadyForDisplay?([
            "target": reactTag
        ])
    }

    // When timeMetadata is read the event onTimedMetadata is triggered
    func handleTimeMetadataChange(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<[AVMetadataItem]?>) {
        guard let newValue = change.newValue, let _items = newValue, _items.count > 0 else {
            return
        }

        var metadata: [[String:String?]?] = []
        for item in _items {
            let value = item.value as? String
            let identifier = item.identifier?.rawValue

            if let value = value {
                metadata.append(["value":value, "identifier":identifier])
            }
        }

        onTimedMetadata?([
            "target": reactTag,
            "metadata": metadata
        ])
    }

    // Handle player item status change.
    func handlePlayerItemStatusChange(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<AVPlayerItem.Status>) {
        guard let _playerItem = _playerItem else {
            return
        }

        if _playerItem.status == .readyToPlay {
            handleReadyToPlay()
        } else if _playerItem.status == .failed {
            handlePlaybackFailed()
        }
    }

    func handleReadyToPlay() {
        guard let _playerItem = _playerItem else { return }
        var duration:Float = Float(CMTimeGetSeconds(_playerItem.asset.duration))

        if duration.isNaN {
            duration = 0.0
        }

        var width: Float? = nil
        var height: Float? = nil
        var orientation = "undefined"

        if _playerItem.asset.tracks(withMediaType: AVMediaType.video).count > 0 {
            let videoTrack = _playerItem.asset.tracks(withMediaType: .video)[0]
            width = Float(videoTrack.naturalSize.width)
            height = Float(videoTrack.naturalSize.height)
            let preferredTransform = videoTrack.preferredTransform

            if (videoTrack.naturalSize.width == preferredTransform.tx
                && videoTrack.naturalSize.height == preferredTransform.ty)
                || (preferredTransform.tx == 0 && preferredTransform.ty == 0)
            {
                orientation = "landscape"
            } else {
                orientation = "portrait"
            }
        } else if _playerItem.presentationSize.height != 0.0 {
            width = Float(_playerItem.presentationSize.width)
            height = Float(_playerItem.presentationSize.height)
            orientation = _playerItem.presentationSize.width > _playerItem.presentationSize.height ? "landscape" : "portrait"
        }

        if _pendingSeek {
            setSeek([
                "time": NSNumber(value: _pendingSeekTime),
                "tolerance": NSNumber(value: 100)
            ])
            _pendingSeek = false
        }

        if _videoLoadStarted {
            let audioTracks = RCTVideoUtils.getAudioTrackInfo(_player)
            let textTracks = RCTVideoUtils.getTextTrackInfo(_player).map(\.json)
            onVideoLoad?(["duration": NSNumber(value: duration),
                          "currentTime": NSNumber(value: Float(CMTimeGetSeconds(_playerItem.currentTime()))),
                          "canPlayReverse": NSNumber(value: _playerItem.canPlayReverse),
                          "canPlayFastForward": NSNumber(value: _playerItem.canPlayFastForward),
                          "canPlaySlowForward": NSNumber(value: _playerItem.canPlaySlowForward),
                          "canPlaySlowReverse": NSNumber(value: _playerItem.canPlaySlowReverse),
                          "canStepBackward": NSNumber(value: _playerItem.canStepBackward),
                          "canStepForward": NSNumber(value: _playerItem.canStepForward),
                          "naturalSize": [
                            "width": width != nil ? NSNumber(value: width!) : "undefinded",
                            "height": width != nil ? NSNumber(value: height!) : "undefinded",
                            "orientation": orientation
                          ],
                          "audioTracks": audioTracks,
                          "textTracks": textTracks,
                          "target": reactTag as Any])
        }
        _videoLoadStarted = false
        _playerObserver.attachPlayerEventListeners()
        applyModifiers()
    }

    func handlePlaybackFailed() {
        guard let _playerItem = _playerItem else { return }
        onVideoError?(
            [
                "error": [
                    "code": NSNumber(value: (_playerItem.error! as NSError).code),
                    "localizedDescription": _playerItem.error?.localizedDescription == nil ? "" : _playerItem.error?.localizedDescription,
                    "localizedFailureReason": ((_playerItem.error! as NSError).localizedFailureReason == nil ? "" : (_playerItem.error! as NSError).localizedFailureReason) ?? "",
                    "localizedRecoverySuggestion": ((_playerItem.error! as NSError).localizedRecoverySuggestion == nil ? "" : (_playerItem.error! as NSError).localizedRecoverySuggestion) ?? "",
                    "domain": (_playerItem.error as! NSError).domain
                ],
                "target": reactTag
            ])
    }

    func handlePlaybackBufferKeyEmpty(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<Bool>) {
        _playerBufferEmpty = true
        onVideoBuffer?(["isBuffering": true, "target": reactTag as Any])
    }

    // Continue playing (or not if paused) after being paused due to hitting an unbuffered zone.
    func handlePlaybackLikelyToKeepUp(playerItem:AVPlayerItem, change:NSKeyValueObservedChange<Bool>) {
        if (!(_controls || _fullscreenPlayerPresented) || _playerBufferEmpty) && ((_playerItem?.isPlaybackLikelyToKeepUp) != nil) {
            setPaused(_paused)
        }
        _playerBufferEmpty = false
        onVideoBuffer?(["isBuffering": false, "target": reactTag as Any])
    }

    func handlePlaybackRateChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>) {
        guard let _player = _player else { return }
        onPlaybackRateChange?(["playbackRate": NSNumber(value: _player.rate),
                               "target": reactTag as Any])
        if _playbackStalled && _player.rate > 0 {
            onPlaybackResume?(["playbackRate": NSNumber(value: _player.rate),
                               "target": reactTag as Any])
            _playbackStalled = false
        }
    }

    func handleExternalPlaybackActiveChange(player: AVPlayer, change: NSKeyValueObservedChange<Bool>) {
        guard let _player = _player else { return }
        onVideoExternalPlaybackChange?(["isExternalPlaybackActive": NSNumber(value: _player.isExternalPlaybackActive),
                                        "target": reactTag as Any])
    }

    func handleViewControllerOverlayViewFrameChange(overlayView:UIView, change:NSKeyValueObservedChange<CGRect>) {
        let oldRect = change.oldValue
        let newRect = change.newValue
        if !oldRect!.equalTo(newRect!) {
            // https://github.com/react-native-video/react-native-video/issues/3085#issuecomment-1557293391
            if newRect!.equalTo(UIScreen.main.bounds) {
                RCTLog("in fullscreen")
                if (!_fullscreenUncontrolPlayerPresented) {
                    _fullscreenUncontrolPlayerPresented = true;

                    self.onVideoFullscreenPlayerWillPresent?(["target": self.reactTag as Any])
                    self.onVideoFullscreenPlayerDidPresent?(["target": self.reactTag as Any])
                }
            } else {
                NSLog("not fullscreen")
                if (_fullscreenUncontrolPlayerPresented) {
                    _fullscreenUncontrolPlayerPresented = false;

                    self.onVideoFullscreenPlayerWillDismiss?(["target": self.reactTag as Any])
                    self.onVideoFullscreenPlayerDidDismiss?(["target": self.reactTag as Any])
                }
            }

            self.reactViewController().view.frame = UIScreen.main.bounds
            self.reactViewController().view.setNeedsLayout()
        }
    }

    @objc func handleDidFailToFinishPlaying(notification:NSNotification!) {
        let error:NSError! = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? NSError
        onVideoError?(
            [
                "error": [
                    "code": NSNumber(value: (error as NSError).code),
                    "localizedDescription": error.localizedDescription ?? "",
                    "localizedFailureReason": (error as NSError).localizedFailureReason ?? "",
                    "localizedRecoverySuggestion": (error as NSError).localizedRecoverySuggestion ?? "",
                    "domain": (error as NSError).domain
                ],
                "target": reactTag
            ])
    }

    @objc func handlePlaybackStalled(notification:NSNotification!) {
        onPlaybackStalled?(["target": reactTag as Any])
        _playbackStalled = true
    }

    @objc func handlePlayerItemDidReachEnd(notification:NSNotification!) {
        onVideoEnd?(["target": reactTag as Any])
#if USE_GOOGLE_IMA
        if notification.object as? AVPlayerItem == _player?.currentItem {
            _imaAdsManager.getAdsLoader()?.contentComplete()
        }
#endif
        if _repeat {
            let item:AVPlayerItem! = notification.object as? AVPlayerItem
            item.seek(to: CMTime.zero, completionHandler: nil)
            self.applyModifiers()
        } else {
            self.setPaused(true);
            _playerObserver.removePlayerTimeObserver()
        }
    }

    //unused
    //    @objc func handleAVPlayerAccess(notification:NSNotification!) {
    //        let accessLog:AVPlayerItemAccessLog! = (notification.object as! AVPlayerItem).accessLog()
    //        let lastEvent:AVPlayerItemAccessLogEvent! = accessLog.events.last
    //
    //        /* TODO: get this working
    //         if (self.onBandwidthUpdate) {
    //         self.onBandwidthUpdate(@{@"bitrate": [NSNumber numberWithFloat:lastEvent.observedBitrate]});
    //         }
    //         */
    //    }
}
