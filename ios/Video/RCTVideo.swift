import AVFoundation
import AVKit
import Foundation
#if USE_GOOGLE_IMA
    import GoogleInteractiveMediaAds
#endif
import React

// MARK: - RCTVideo

class RCTVideo: UIView, RCTVideoPlayerViewControllerDelegate, RCTPlayerObserverHandler {
    var _player: AVPlayer?
    private var _playerItem: AVPlayerItem?
    private var _source: VideoSource?
    private var _playerLayer: AVPlayerLayer?
    private var _chapters: [Chapter]?

    private var _playerViewController: RCTVideoPlayerViewController?
    private var _videoURL: NSURL?

    /* Required to publish events */
    private var _eventDispatcher: RCTEventDispatcher?
    private var _videoLoadStarted = false

    private var _pendingSeek = false
    private var _pendingSeekTime: Float = 0.0
    private var _lastSeekTime: Float = 0.0

    /* For sending videoProgress events */
    private var _controls = false

    /* Keep track of any modifiers, need to be applied after each play */
    var _audioOutput: String = "speaker"
    private var _volume: Float = 1.0
    private var _rate: Float = 1.0
    private var _maxBitRate: Float?

    private var _automaticallyWaitsToMinimizeStalling = true
    private var _muted = false
    private var _paused = false
    private var _repeat = false
    private var _isPlaying = false
    private var _allowsExternalPlayback = true
    private var _selectedTextTrackCriteria: SelectedTrackCriteria = .none()
    private var _selectedAudioTrackCriteria: SelectedTrackCriteria = .none()
    private var _playbackStalled = false
    var _playInBackground = false
    private var _preventsDisplaySleepDuringVideoPlayback = true
    private var _preferredForwardBufferDuration: Float = 0.0
    private var _playWhenInactive = false
    var _ignoreSilentSwitch: String = "inherit" // inherit, ignore, obey
    var _mixWithOthers: String = "inherit" // inherit, mix, duck
    private var _resizeMode: String = "cover"
    private var _fullscreen = false
    private var _fullscreenAutorotate = true
    private var _fullscreenOrientation: String = "all"
    private var _fullscreenPlayerPresented = false
    private var _filterName: String!
    private var _filterEnabled = false
    private var _presentingViewController: UIViewController?
    private var _startPosition: Float64 = -1
    var _disableAudioSessionManagement: Bool = false
    var _showNotificationControls = false
    // Buffer last bitrate value received. Initialized to -2 to ensure -1 (sometimes reported by AVPlayer) is not missed
    private var _lastBitrate = -2.0
    private var _enterPictureInPictureOnLeave = false {
        didSet {
            if isPictureInPictureActive() { return }
            if _enterPictureInPictureOnLeave {
                initPictureinPicture()
                if #available(iOS 9.0, tvOS 14.0, *) {
                    _playerViewController?.allowsPictureInPicturePlayback = true
                }
            } else {
                _pip?.deinitPipController()
                if #available(iOS 9.0, tvOS 14.0, *) {
                    _playerViewController?.allowsPictureInPicturePlayback = false
                }
            }
        }
    }

    private let instanceId = UUID().uuidString

    private var _isBuffering = false {
        didSet {
            onVideoBuffer?(["isBuffering": _isBuffering, "target": reactTag as Any])
        }
    }

    /* IMA Ads */
    #if USE_GOOGLE_IMA
        private var _imaAdsManager: RCTIMAAdsManager!
        /* Playhead used by the SDK to track content video progress and insert mid-rolls. */
        private var _contentPlayhead: IMAAVPlayerContentPlayhead?
    #endif
    private var _didRequestAds = false
    private var _adPlaying = false

    private lazy var _drmManager: DRMManagerSpec? = ReactNativeVideoManager.shared.getDRMManager()
    private var _playerObserver: RCTPlayerObserver = .init()

    #if USE_VIDEO_CACHING
        private let _videoCache: RCTVideoCachingHandler = .init()
    #endif

    private var _pip: RCTPictureInPicture?

    // Events
    @objc var onVideoLoadStart: RCTDirectEventBlock?
    @objc var onVideoLoad: RCTDirectEventBlock?
    @objc var onVideoBuffer: RCTDirectEventBlock?
    @objc var onVideoError: RCTDirectEventBlock?
    @objc var onVideoProgress: RCTDirectEventBlock?
    @objc var onVideoBandwidthUpdate: RCTDirectEventBlock?
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
    @objc var onVolumeChange: RCTDirectEventBlock?
    @objc var onVideoPlaybackStateChanged: RCTDirectEventBlock?
    @objc var onVideoExternalPlaybackChange: RCTDirectEventBlock?
    @objc var onPictureInPictureStatusChanged: RCTDirectEventBlock?
    @objc var onRestoreUserInterfaceForPictureInPictureStop: RCTDirectEventBlock?
    @objc var onGetLicense: RCTDirectEventBlock?
    @objc var onReceiveAdEvent: RCTDirectEventBlock?
    @objc var onTextTracks: RCTDirectEventBlock?
    @objc var onAudioTracks: RCTDirectEventBlock?
    @objc var onTextTrackDataChanged: RCTDirectEventBlock?

    @objc
    func _onPictureInPictureEnter() {
        onPictureInPictureStatusChanged?(["isActive": NSNumber(value: true)])
    }

    @objc
    func _onPictureInPictureExit() {
        onPictureInPictureStatusChanged?(["isActive": NSNumber(value: false)])
    }

    func handlePictureInPictureEnter() {
        onPictureInPictureStatusChanged?(["isActive": NSNumber(value: true)])
    }

    func handlePictureInPictureExit() {
        onPictureInPictureStatusChanged?(["isActive": NSNumber(value: false)])

        // To continue audio playback in backgroud we need to set
        // player in _playerLayer & _playerViewController to nil
        let appState = UIApplication.shared.applicationState
        if _playInBackground && appState == .background {
            _playerLayer?.player = nil
            _playerViewController?.player = nil
            _player?.play()
        }
    }

    func handleRestoreUserInterfaceForPictureInPictureStop() {
        onRestoreUserInterfaceForPictureInPictureStop?([:])
    }

    func isPictureInPictureActive() -> Bool {
        #if os(iOS)
            return _pip?._pipController?.isPictureInPictureActive == true
        #else
            return false
        #endif
    }

    func initPictureinPicture() {
        #if os(iOS)
            if _pip == nil {
                _pip = RCTPictureInPicture({ [weak self] in
                    self?._onPictureInPictureEnter()
                }, { [weak self] in
                    self?._onPictureInPictureExit()
                }, { [weak self] in
                    self?.onRestoreUserInterfaceForPictureInPictureStop?([:])
                })
            }

            if _playerLayer != nil && !_controls && _pip?._pipController == nil {
                _pip?.setupPipController(_playerLayer)
            }
        #else
            DebugLog("Picture in Picture is not supported on this platform")
        #endif
    }

    init(eventDispatcher: RCTEventDispatcher!) {
        super.init(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
        ReactNativeVideoManager.shared.registerView(newInstance: self)
        #if USE_GOOGLE_IMA
            _imaAdsManager = RCTIMAAdsManager(video: self, isPictureInPictureActive: isPictureInPictureActive)
        #endif

        _eventDispatcher = eventDispatcher

        AudioSessionManager.shared.registerView(view: self)

        #if os(iOS)
            if _enterPictureInPictureOnLeave {
                initPictureinPicture()
            }
        #endif

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillResignActive(notification:)),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive(notification:)),
            name: UIApplication.didBecomeActiveNotification,
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
            selector: #selector(screenWillLock),
            name: UIApplication.protectedDataWillBecomeUnavailableNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenDidUnlock),
            name: UIApplication.protectedDataDidBecomeAvailableNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioRouteChanged(notification:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )

        #if os(iOS)
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleRotation),
                name: UIDevice.orientationDidChangeNotification,
                object: nil
            )
        #endif

        _playerObserver._handlers = self
        #if USE_VIDEO_CACHING
            _videoCache.playerItemPrepareText = playerItemPrepareText
        #endif
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        #if USE_GOOGLE_IMA
            _imaAdsManager = RCTIMAAdsManager(video: self, isPictureInPictureActive: isPictureInPictureActive)
        #endif
    }

    deinit {
        #if USE_GOOGLE_IMA
            _imaAdsManager.releaseAds()
            _imaAdsManager = nil
        #endif
        AudioSessionManager.shared.unregisterView(view: self)

        NotificationCenter.default.removeObserver(self)
        self.removePlayerLayer()
        _playerObserver.clearPlayer()

        if let player = _player {
            NowPlayingInfoCenterManager.shared.removePlayer(player: player)
        }

        #if os(iOS)
            _pip = nil
        #endif

        ReactNativeVideoManager.shared.unregisterView(newInstance: self)
        AudioSessionManager.shared.unregisterView(view: self)
    }

    // MARK: - App lifecycle handlers

    func getIsExternalPlaybackActive() -> Bool {
        #if os(visionOS)
            let isExternalPlaybackActive = false
        #else
            let isExternalPlaybackActive = _player?.isExternalPlaybackActive ?? false
        #endif
        return isExternalPlaybackActive
    }

    @objc
    func handleRotation() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            self.setNeedsLayout()
            self.layoutIfNeeded()

            if let playerViewController = self._playerViewController {
                playerViewController.view.frame = UIScreen.main.bounds
                playerViewController.view.setNeedsLayout()
                playerViewController.view.layoutIfNeeded()

                // Update content overlay and subviews
                playerViewController.contentOverlayView?.frame = UIScreen.main.bounds
                for subview in playerViewController.contentOverlayView?.subviews ?? [] {
                    subview.frame = UIScreen.main.bounds
                }
            }
        }
    }

    @objc
    func applicationWillResignActive(notification _: NSNotification!) {
        let isExternalPlaybackActive = getIsExternalPlaybackActive()
        if _playInBackground || _playWhenInactive || !_isPlaying || isExternalPlaybackActive { return }

        _player?.pause()
        _player?.rate = 0.0
    }

    @objc
    func applicationDidBecomeActive(notification _: NSNotification!) {
        let isExternalPlaybackActive = getIsExternalPlaybackActive()
        if _playInBackground || _playWhenInactive || !_isPlaying || isExternalPlaybackActive { return }

        // Resume the player or any other tasks that should continue when the app becomes active.
        _player?.play()
        _player?.rate = _rate
    }

    @objc
    func applicationDidEnterBackground(notification _: NSNotification!) {
        if !_paused && isPictureInPictureActive() {
            _player?.play()
            _player?.rate = _rate
        }
        let isExternalPlaybackActive = getIsExternalPlaybackActive()
        if !_playInBackground || isExternalPlaybackActive || isPictureInPictureActive() { return }
        // Needed to play sound in background. See https://developer.apple.com/library/ios/qa/qa1668/_index.html
        _playerLayer?.player = nil
        _playerViewController?.player = nil
    }

    @objc
    func applicationWillEnterForeground(notification _: NSNotification!) {
        self.applyModifiers()
        _playerLayer?.player = _player
        _playerViewController?.player = _player
    }

    @objc
    func screenWillLock() {
        let isActiveBackgroundPip = isPictureInPictureActive() && UIApplication.shared.applicationState != .active
        if _playInBackground || !_isPlaying || !isActiveBackgroundPip { return }

        _player?.pause()
        _player?.rate = 0.0
    }

    @objc
    func screenDidUnlock() {
        let isActiveBackgroundPip = isPictureInPictureActive() && UIApplication.shared.applicationState != .active
        if _paused || !isActiveBackgroundPip { return }

        _player?.play()
        _player?.rate = _rate
    }

    // MARK: - Audio events

    @objc
    func audioRouteChanged(notification: NSNotification!) {
        if let userInfo = notification.userInfo {
            let reason: AVAudioSession.RouteChangeReason! = userInfo[AVAudioSessionRouteChangeReasonKey] as? AVAudioSession.RouteChangeReason
            //            let previousRoute:NSNumber! = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? NSNumber
            if reason == .oldDeviceUnavailable, let onVideoAudioBecomingNoisy {
                onVideoAudioBecomingNoisy(["target": reactTag as Any])
            }
        }
    }

    // MARK: - Progress

    func sendProgressUpdate(didEnd: Bool = false) {
        #if !USE_GOOGLE_IMA
            // If we dont use Ads and onVideoProgress is not defined we dont need to run this code
            guard onVideoProgress != nil else { return }
        #endif

        if let video = _player?.currentItem,
           video.status != AVPlayerItem.Status.readyToPlay {
            return
        }

        let playerDuration: CMTime = RCTVideoUtils.playerItemDuration(_player)
        if CMTIME_IS_INVALID(playerDuration) {
            return
        }

        var currentTime = _player?.currentTime()
        if currentTime != nil && _source?.cropStart != nil {
            currentTime = CMTimeSubtract(currentTime!, CMTimeMake(value: _source?.cropStart ?? 0, timescale: 1000))
        }
        let currentPlaybackTime = _player?.currentItem?.currentDate()
        let duration = CMTimeGetSeconds(playerDuration)
        var currentTimeSecs = CMTimeGetSeconds(currentTime ?? .zero)

        if currentTimeSecs > duration || didEnd {
            currentTimeSecs = duration
        }

        if currentTimeSecs >= 0 {
            #if USE_GOOGLE_IMA
                if !_didRequestAds && currentTimeSecs >= 0.0001 && _source?.adParams.adTagUrl != nil {
                    _imaAdsManager.requestAds()
                    _didRequestAds = true
                }
            #endif
            onVideoProgress?([
                "currentTime": currentTimeSecs,
                "playableDuration": RCTVideoUtils.calculatePlayableDuration(_player, withSource: _source),
                "atValue": currentTime?.value ?? .zero,
                "currentPlaybackTime": NSNumber(value: Double(currentPlaybackTime?.timeIntervalSince1970 ?? 0 * 1000)).int64Value,
                "target": reactTag as Any,
                "seekableDuration": RCTVideoUtils.calculateSeekableDuration(_player),
            ])
        }
    }

    var isSetSourceOngoing = false
    var nextSource: NSDictionary?

    func applyNextSource() {
        if self.nextSource != nil {
            DebugLog("apply next source")
            self.isSetSourceOngoing = false
            let nextSrc = self.nextSource
            self.nextSource = nil
            self.setSrc(nextSrc)
        }
    }

    // MARK: - Player and source

    func preparePlayerItem() async throws -> AVPlayerItem {
        guard let source = _source else {
            DebugLog("The source not exist")
            isSetSourceOngoing = false
            applyNextSource()
            throw NSError(domain: "", code: 0, userInfo: nil)
        }

        // Perform on next run loop, otherwise onVideoLoadStart is nil
        onVideoLoadStart?([
            "src": [
                "uri": _source?.uri ?? NSNull() as Any,
                "type": _source?.type ?? NSNull(),
                "isNetwork": NSNumber(value: _source?.isNetwork ?? false),
            ],
            "drm": source.drm.json ?? NSNull(),
            "target": reactTag as Any,
        ])

        if let uri = source.uri, uri.starts(with: "ph://") {
            guard let photoAsset = await RCTVideoUtils.preparePHAsset(uri: uri) else {
                DebugLog("Could not load asset '\(String(describing: _source))'")
                throw NSError(domain: "", code: 0, userInfo: nil)
            }

            if let overridePlayerAsset = await ReactNativeVideoManager.shared.overridePlayerAsset(source: source, asset: photoAsset) {
                if overridePlayerAsset.type == .full {
                    return AVPlayerItem(asset: overridePlayerAsset.asset)
                }

                return await playerItemPrepareText(source: source, asset: overridePlayerAsset.asset, assetOptions: nil, uri: source.uri ?? "")
            }

            return await playerItemPrepareText(source: source, asset: photoAsset, assetOptions: nil, uri: source.uri ?? "")
        }

        guard let assetResult = RCTVideoUtils.prepareAsset(source: source),
              let asset = assetResult.asset,
              let assetOptions = assetResult.assetOptions else {
            DebugLog("Could not find video URL in source '\(String(describing: _source))'")
            isSetSourceOngoing = false
            applyNextSource()
            throw NSError(domain: "", code: 0, userInfo: nil)
        }

        if let startPosition = _source?.startPosition {
            _startPosition = startPosition / 1000
        }

        #if USE_VIDEO_CACHING
            if _videoCache.shouldCache(source: source) {
                return try await _videoCache.playerItemForSourceUsingCache(source: source, assetOptions: assetOptions)
            }
        #endif

        if source.drm.json != nil {
            if _drmManager == nil {
                _drmManager = ReactNativeVideoManager.shared.getDRMManager()
            }

            _drmManager?.createContentKeyRequest(
                asset: asset,
                drmParams: source.drm,
                reactTag: reactTag,
                onVideoError: onVideoError,
                onGetLicense: onGetLicense
            )
        }

        if let overridePlayerAsset = await ReactNativeVideoManager.shared.overridePlayerAsset(source: source, asset: asset) {
            if overridePlayerAsset.type == .full {
                return AVPlayerItem(asset: overridePlayerAsset.asset)
            }

            return await playerItemPrepareText(source: source, asset: overridePlayerAsset.asset, assetOptions: assetOptions, uri: source.uri ?? "")
        }

        return await playerItemPrepareText(source: source, asset: asset, assetOptions: assetOptions, uri: source.uri ?? "")
    }

    func setupPlayer(playerItem: AVPlayerItem) async throws {
        if !isSetSourceOngoing {
            DebugLog("setSrc has been canceled last step")
            return
        }

        _player?.pause()
        _playerItem = playerItem
        _playerObserver.playerItem = _playerItem
        setPreferredForwardBufferDuration(_preferredForwardBufferDuration)
        setPlaybackRange(playerItem, withCropStart: _source?.cropStart, withCropEnd: _source?.cropEnd)
        setFilter(_filterName)
        if let maxBitRate = _maxBitRate {
            _playerItem?.preferredPeakBitRate = Double(maxBitRate)
        }

        if _player == nil {
            _player = AVPlayer()
            ReactNativeVideoManager.shared.onInstanceCreated(id: instanceId, player: _player as Any)

            _player!.replaceCurrentItem(with: playerItem)

            if _showNotificationControls {
                // We need to register player after we set current item and only for init
                NowPlayingInfoCenterManager.shared.registerPlayer(player: _player!)
            }
        } else {
            #if !os(tvOS) && !os(visionOS)
                if #available(iOS 16.0, macCatalyst 18.0, *) {
                    // This feature caused crashes, if the app was put in bg, before the source change
                    // https://github.com/TheWidlarzGroup/react-native-video/issues/3900
                    self._playerViewController?.allowsVideoFrameAnalysis = false
                }
            #endif
            _player?.replaceCurrentItem(with: playerItem)
            #if !os(tvOS) && !os(visionOS)
                if #available(iOS 16.0, macCatalyst 18.0, *) {
                    self._playerViewController?.allowsVideoFrameAnalysis = true
                }
            #endif
            // later we can just call "updateNowPlayingInfo:
            NowPlayingInfoCenterManager.shared.updateNowPlayingInfo()
        }

        _playerObserver.player = _player
        applyModifiers()
        _player?.actionAtItemEnd = .none

        if #available(iOS 10.0, *) {
            setAutomaticallyWaitsToMinimizeStalling(_automaticallyWaitsToMinimizeStalling)
        }

        #if USE_GOOGLE_IMA
            if _source?.adParams.adTagUrl != nil {
                // Set up your content playhead and contentComplete callback.
                _contentPlayhead = IMAAVPlayerContentPlayhead(avPlayer: _player!)

                _imaAdsManager.setUpAdsLoader()
            }
        #endif
        isSetSourceOngoing = false
        applyNextSource()
    }

    @objc
    func setSrc(_ source: NSDictionary!) {
        if self.isSetSourceOngoing || self.nextSource != nil {
            DebugLog("setSrc buffer request")
            self._player?.replaceCurrentItem(with: nil)
            nextSource = source
            return
        }
        self.isSetSourceOngoing = true

        let initializeSource = {
            self._source = VideoSource(source)
            if self._source?.uri == nil || self._source?.uri == "" {
                self._player?.replaceCurrentItem(with: nil)
                self.isSetSourceOngoing = false
                self.applyNextSource()

                if let player = self._player {
                    NowPlayingInfoCenterManager.shared.removePlayer(player: player)
                }

                DebugLog("setSrc Stopping playback")
                return
            }

            // Ensure UI operations are performed on main thread
            DispatchQueue.main.sync {
                self.removePlayerLayer()
            }
            self._playerObserver.player = nil
            self._drmManager = nil
            self._playerObserver.playerItem = nil

            // perform on next run loop, otherwise other passed react-props may not be set
            RCTVideoUtils.delay { [weak self] in
                do {
                    guard let self else { throw NSError(domain: "", code: 0, userInfo: nil) }

                    let playerItem = try await self.preparePlayerItem()
                    try await self.setupPlayer(playerItem: playerItem)
                } catch {
                    DebugLog("An error occurred: \(error.localizedDescription)")

                    if let self {
                        self.onVideoError?(["error": error.localizedDescription])
                        self.isSetSourceOngoing = false
                        self.applyNextSource()

                        if let player = self._player {
                            NowPlayingInfoCenterManager.shared.removePlayer(player: player)
                        }
                    }
                }
            }

            self._videoLoadStarted = true
            self.applyNextSource()
        }

        DispatchQueue.global(qos: .default).async(execute: initializeSource)
    }

    func playerItemPrepareText(source: VideoSource, asset: AVAsset!, assetOptions: NSDictionary?, uri: String) async -> AVPlayerItem {
        if source.textTracks.isEmpty == true || uri.hasSuffix(".m3u8") {
            return await self.playerItemPropegateMetadata(AVPlayerItem(asset: asset))
        }

        // AVPlayer can't airplay AVMutableCompositions
        self._allowsExternalPlayback = false
        let mixComposition = await RCTVideoUtils.generateMixComposition(asset)
        let validTextTracks = await RCTVideoUtils.getValidTextTracks(
            asset: asset,
            assetOptions: assetOptions,
            mixComposition: mixComposition,
            textTracks: source.textTracks
        )

        if validTextTracks.isEmpty {
            DebugLog("Strange state, not valid textTrack")
        }

        if validTextTracks.count != source.textTracks.count {
            setSelectedTextTrack(_selectedTextTrackCriteria)
        }

        return await self.playerItemPropegateMetadata(AVPlayerItem(asset: mixComposition))
    }

    func playerItemPropegateMetadata(_ playerItem: AVPlayerItem!) async -> AVPlayerItem {
        var mapping: [AVMetadataIdentifier: Any] = [:]

        if let title = _source?.customMetadata?.title {
            mapping[.commonIdentifierTitle] = title
        }

        if let artist = _source?.customMetadata?.artist {
            mapping[.commonIdentifierArtist] = artist
        }

        if let subtitle = _source?.customMetadata?.subtitle {
            mapping[.iTunesMetadataTrackSubTitle] = subtitle
        }

        if let description = _source?.customMetadata?.description {
            mapping[.commonIdentifierDescription] = description
        }

        if let imageUri = _source?.customMetadata?.imageUri,
           let imageData = await RCTVideoUtils.createImageMetadataItem(imageUri: imageUri) {
            mapping[.commonIdentifierArtwork] = imageData
        }

        if #available(iOS 12.2, *), !mapping.isEmpty {
            playerItem.externalMetadata = RCTVideoUtils.createMetadataItems(for: mapping)
        }

        #if os(tvOS)
            if let chapters = _chapters {
                playerItem.navigationMarkerGroups = RCTVideoTVUtils.makeNavigationMarkerGroups(chapters)
            }
        #endif

        return playerItem
    }

    // MARK: - Prop setters

    @objc
    func setResizeMode(_ mode: String) {
        var resizeMode: AVLayerVideoGravity = .resizeAspect

        switch mode {
        case "contain":
            resizeMode = .resizeAspect
        case "none":
            resizeMode = .resizeAspect
        case "cover":
            resizeMode = .resizeAspectFill
        case "stretch":
            resizeMode = .resize
        default:
            resizeMode = .resizeAspect
        }

        if _controls {
            _playerViewController?.videoGravity = resizeMode
        } else {
            _playerLayer?.videoGravity = resizeMode
        }

        _resizeMode = mode
    }

    @objc
    func setPlayInBackground(_ playInBackground: Bool) {
        _playInBackground = playInBackground
    }

    @objc
    func setPreventsDisplaySleepDuringVideoPlayback(_ preventsDisplaySleepDuringVideoPlayback: Bool) {
        _preventsDisplaySleepDuringVideoPlayback = preventsDisplaySleepDuringVideoPlayback
        self.applyModifiers()
    }

    @objc
    func setAllowsExternalPlayback(_ allowsExternalPlayback: Bool) {
        _allowsExternalPlayback = allowsExternalPlayback
        #if !os(visionOS)
            _player?.allowsExternalPlayback = _allowsExternalPlayback
        #endif
    }

    @objc
    func setPlayWhenInactive(_ playWhenInactive: Bool) {
        _playWhenInactive = playWhenInactive
    }

    @objc
    func setEnterPictureInPictureOnLeave(_ enterPictureInPictureOnLeave: Bool) {
        #if os(iOS)
            if _enterPictureInPictureOnLeave != enterPictureInPictureOnLeave {
                _enterPictureInPictureOnLeave = enterPictureInPictureOnLeave

                AudioSessionManager.shared.playerPropertiesChanged(view: self)
            }
        #endif
    }

    @objc
    func setRestoreUserInterfaceForPIPStopCompletionHandler(_ restore: Bool) {
        #if os(iOS)
            if _pip != nil {
                _pip?.setRestoreUserInterfaceForPIPStopCompletionHandler(restore)
            } else {
                _playerObserver.setRestoreUserInterfaceForPIPStopCompletionHandler(restore)
            }
        #endif
    }

    @objc
    func setIgnoreSilentSwitch(_ ignoreSilentSwitch: String?) {
        _ignoreSilentSwitch = ignoreSilentSwitch ?? "inherit"

        AudioSessionManager.shared.playerPropertiesChanged(view: self)
    }

    @objc
    func setMixWithOthers(_ mixWithOthers: String?) {
        _mixWithOthers = mixWithOthers ?? "inherit"

        AudioSessionManager.shared.playerPropertiesChanged(view: self)
    }

    @objc
    func setPaused(_ paused: Bool) {
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
        AudioSessionManager.shared.playerPropertiesChanged(view: self)
    }

    @objc
    func setSeek(_ time: NSNumber, _ tolerance: NSNumber) {
        let item: AVPlayerItem? = _player?.currentItem

        _pendingSeek = true

        guard item != nil, let player = _player, let item, item.status == AVPlayerItem.Status.readyToPlay else {
            _pendingSeekTime = time.floatValue
            return
        }

        RCTPlayerOperations.seek(
            player: player,
            playerItem: item,
            paused: _paused,
            seekTime: time.floatValue,
            seekTolerance: tolerance.floatValue
        ) { [weak self] (_: Bool) in
            guard let self else { return }

            self._playerObserver.addTimeObserverIfNotSet()
            self.setPaused(self._paused)
            self.onVideoSeek?(["currentTime": NSNumber(value: Float(CMTimeGetSeconds(item.currentTime()))),
                               "seekTime": time,
                               "target": self.reactTag as Any])
        }

        _pendingSeek = false
    }

    @objc
    func setRate(_ rate: Float) {
        if _rate != 1 {
            // This is a workaround
            // when player change from rate != 1 to another rate != 1 we see some video blocking
            // To bypass it we shall force the rate to 1 and apply real valut afterward
            _player?.rate = 1
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                self._rate = rate
                self.applyModifiers()
            }
        } else {
            // apply it directly
            self._rate = rate
            self.applyModifiers()
        }
    }

    @objc
    func isMuted() -> Bool {
        return _muted
    }

    @objc
    func setMuted(_ muted: Bool) {
        _muted = muted
        applyModifiers()
    }

    @objc
    func setAudioOutput(_ audioOutput: String) {
        _audioOutput = audioOutput

        // Notify AudioSessionManager about the change instead of directly configuring
        AudioSessionManager.shared.playerPropertiesChanged(view: self)
    }

    @objc
    func setVolume(_ volume: Float) {
        _volume = volume
        applyModifiers()
    }

    @objc
    func setMaxBitRate(_ maxBitRate: Float) {
        _maxBitRate = maxBitRate
        _playerItem?.preferredPeakBitRate = Double(maxBitRate)
    }

    @objc
    func setPreferredForwardBufferDuration(_ preferredForwardBufferDuration: Float) {
        _preferredForwardBufferDuration = preferredForwardBufferDuration
        if #available(iOS 10.0, *) {
            _playerItem?.preferredForwardBufferDuration = TimeInterval(preferredForwardBufferDuration)
        } else {
            // Fallback on earlier versions
        }
    }

    @objc
    func setAutomaticallyWaitsToMinimizeStalling(_ waits: Bool) {
        _automaticallyWaitsToMinimizeStalling = waits
        if #available(iOS 10.0, *) {
            _player?.automaticallyWaitsToMinimizeStalling = waits
        } else {
            // Fallback on earlier versions
        }
    }

    func setPlaybackRange(_ item: AVPlayerItem!, withCropStart cropStart: Int64?, withCropEnd cropEnd: Int64?) {
        if let cropStart {
            let start = CMTimeMake(value: cropStart, timescale: 1000)
            item.reversePlaybackEndTime = start
            _pendingSeekTime = Float(CMTimeGetSeconds(start))
            _pendingSeek = true
        }
        if let cropEnd {
            item.forwardPlaybackEndTime = CMTimeMake(value: cropEnd, timescale: 1000)
        }
    }

    func applyModifiers() {
        if let video = _player?.currentItem,
           video.status != AVPlayerItem.Status.readyToPlay {
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

        if #available(iOS 12.0, tvOS 12.0, *) {
            #if !os(visionOS)
                _player?.preventsDisplaySleepDuringVideoPlayback = _preventsDisplaySleepDuringVideoPlayback
            #endif
        } else {
            // Fallback on earlier versions
        }

        if let _maxBitRate {
            setMaxBitRate(_maxBitRate)
        }

        setSelectedTextTrack(_selectedTextTrackCriteria)
        setSelectedAudioTrack(_selectedAudioTrackCriteria)
        setResizeMode(_resizeMode)
        setRepeat(_repeat)
        setControls(_controls)
        setPaused(_paused)
        setAllowsExternalPlayback(_allowsExternalPlayback)

        AudioSessionManager.shared.playerPropertiesChanged(view: self)
    }

    @objc
    func setRepeat(_ repeat: Bool) {
        _repeat = `repeat`
    }

    @objc
    func setSelectedAudioTrack(_ selectedAudioTrack: NSDictionary?) {
        setSelectedAudioTrack(SelectedTrackCriteria(selectedAudioTrack))
    }

    func setSelectedAudioTrack(_ selectedAudioTrack: SelectedTrackCriteria?) {
        _selectedAudioTrackCriteria = selectedAudioTrack ?? SelectedTrackCriteria.none()
        Task {
            await RCTPlayerOperations.setMediaSelectionTrackForCharacteristic(player: _player, characteristic: AVMediaCharacteristic.audible,
                                                                              criteria: _selectedAudioTrackCriteria)
        }
    }

    @objc
    func setSelectedTextTrack(_ selectedTextTrack: NSDictionary?) {
        setSelectedTextTrack(SelectedTrackCriteria(selectedTextTrack))
    }

    func setSelectedTextTrack(_ selectedTextTrack: SelectedTrackCriteria?) {
        _selectedTextTrackCriteria = selectedTextTrack ?? SelectedTrackCriteria.none()
        guard let source = _source else { return }
        if !source.textTracks.isEmpty { // sideloaded text tracks
            RCTPlayerOperations.setSideloadedText(player: _player, textTracks: source.textTracks, criteria: _selectedTextTrackCriteria)
        } else { // text tracks included in the HLS playlist
            Task { [weak self] in
                guard let self,
                      let player = self._player else { return }

                await RCTPlayerOperations.setMediaSelectionTrackForCharacteristic(
                    player: player,
                    characteristic: .legible,
                    criteria: self._selectedTextTrackCriteria
                )
            }
        }
    }

    @objc
    func setChapters(_ chapters: [NSDictionary]?) {
        setChapters(chapters?.map { Chapter($0) })
    }

    func setChapters(_ chapters: [Chapter]?) {
        _chapters = chapters
    }

    @objc
    func setFullscreen(_ fullscreen: Bool) {
        let alreadyFullscreenPresented = _presentingViewController?.presentedViewController != nil
        if fullscreen && !_fullscreenPlayerPresented && _player != nil && !alreadyFullscreenPresented {
            // Ensure player view controller is not null
            // Controls will be displayed even if it is disabled in configuration
            if _playerViewController == nil {
                self.usePlayerViewController()
            }

            // Set presentation style to fullscreen
            _playerViewController?.modalPresentationStyle = .fullScreen

            // Find the nearest view controller
            var viewController: UIViewController! = self.firstAvailableUIViewController()
            if viewController == nil {
                guard let keyWindow = RCTVideoUtils.getCurrentWindow() else { return }

                viewController = keyWindow.rootViewController
                if !viewController.children.isEmpty {
                    viewController = viewController.children.last
                }
            }
            if viewController != nil {
                _presentingViewController = viewController

                self.onVideoFullscreenPlayerWillPresent?(["target": reactTag as Any])

                if let playerViewController = _playerViewController {
                    if _controls {
                        // prevents crash https://github.com/TheWidlarzGroup/react-native-video/issues/3040
                        self._playerViewController?.removeFromParent()
                    }

                    viewController.present(playerViewController, animated: true, completion: { [weak self] in
                        guard let self else { return }
                        // In fullscreen we must display controls
                        self._playerViewController?.showsPlaybackControls = true
                        self._fullscreenPlayerPresented = fullscreen
                        self._playerViewController?.autorotate = self._fullscreenAutorotate

                        // update layout after entering fullscreen
                        DispatchQueue.main.async {
                            self._playerViewController?.view.frame = UIScreen.main.bounds
                            self._playerViewController?.view.setNeedsLayout()
                            self._playerViewController?.view.layoutIfNeeded()

                            // update content overlay subviews
                            self._playerViewController?.contentOverlayView?.frame = UIScreen.main.bounds
                            for subview in self._playerViewController?.contentOverlayView?.subviews ?? [] {
                                subview.frame = UIScreen.main.bounds
                            }
                        }

                        self.onVideoFullscreenPlayerDidPresent?(["target": self.reactTag as Any])
                    })
                }
            }
        } else if !fullscreen && _fullscreenPlayerPresented, let _playerViewController {
            self.videoPlayerViewControllerWillDismiss(playerViewController: _playerViewController)
            _presentingViewController?.dismiss(animated: true, completion: { [weak self] in
                self?.videoPlayerViewControllerDidDismiss(playerViewController: _playerViewController)
            })
            setControls(_controls)

            // ensure layout updates after exiting fullscreen
            DispatchQueue.main.async {
                self.setNeedsLayout()
                self.layoutIfNeeded()
            }
        }
    }

    @objc
    func setFullscreenAutorotate(_ autorotate: Bool) {
        _fullscreenAutorotate = autorotate
        if _fullscreenPlayerPresented {
            _playerViewController?.autorotate = autorotate
        }
    }

    @objc
    func setFullscreenOrientation(_ orientation: String?) {
        _fullscreenOrientation = orientation ?? "all"
        if _fullscreenPlayerPresented {
            _playerViewController?.preferredOrientation = _fullscreenOrientation
        }
    }

    func usePlayerViewController() {
        guard let _player, let _playerItem else { return }

        if _playerViewController == nil {
            _playerViewController = createPlayerViewController(player: _player, withPlayerItem: _playerItem)
        }
        // to prevent video from being animated when resizeMode is 'cover'
        // resize mode must be set before subview is added
        setResizeMode(_resizeMode)

        guard let _playerViewController else { return }

        if _controls {
            let viewController: UIViewController! = self.reactViewController()
            viewController?.addChild(_playerViewController)
            self.addSubview(_playerViewController.view)

            NSLayoutConstraint.activate([
                _playerViewController.view.leadingAnchor.constraint(equalTo: self.leadingAnchor),
                _playerViewController.view.trailingAnchor.constraint(equalTo: self.trailingAnchor),
                _playerViewController.view.topAnchor.constraint(equalTo: self.topAnchor),
                _playerViewController.view.bottomAnchor.constraint(equalTo: self.bottomAnchor),
            ])
        }

        _playerObserver.playerViewController = _playerViewController
    }

    func createPlayerViewController(player: AVPlayer, withPlayerItem _: AVPlayerItem) -> RCTVideoPlayerViewController {
        let viewController = RCTVideoPlayerViewController()
        viewController.showsPlaybackControls = self._controls
        #if !os(tvOS)
            viewController.updatesNowPlayingInfoCenter = false
        #endif
        viewController.rctDelegate = self
        viewController.preferredOrientation = _fullscreenOrientation

        viewController.view.frame = self.bounds
        viewController.player = player

        // Set the initial playback speed in controls to match playback rate
        if #available(iOS 16.0, tvOS 16.0, *) {
            if let initialSpeed = viewController.speeds.first(where: { $0.rate == _rate }) {
                viewController.selectSpeed(initialSpeed)
            }
        }

        if #available(iOS 9.0, tvOS 14.0, *) {
            viewController.allowsPictureInPicturePlayback = _enterPictureInPictureOnLeave
        }
        return viewController
    }

    func usePlayerLayer() {
        if let _player {
            _playerLayer = AVPlayerLayer(player: _player)
            _playerLayer?.frame = self.bounds
            _playerLayer?.needsDisplayOnBoundsChange = true

            // to prevent video from being animated when resizeMode is 'cover'
            // resize mode must be set before layer is added
            setResizeMode(_resizeMode)
            _playerObserver.playerLayer = _playerLayer

            if let _playerLayer {
                self.layer.addSublayer(_playerLayer)
            }
            self.layer.needsDisplayOnBoundsChange = true
            #if os(iOS)
                if _enterPictureInPictureOnLeave {
                    _pip?.setupPipController(_playerLayer)
                }
            #endif
        }
    }

    @objc
    func setControls(_ controls: Bool) {
        if _controls != controls || ((_playerLayer == nil) && (_playerViewController == nil)) {
            _controls = controls
            if _controls {
                DispatchQueue.main.async {
                    self.removePlayerLayer()
                    self.usePlayerViewController()
                }
            } else {
                DispatchQueue.main.async {
                    self._playerViewController?.view.removeFromSuperview()
                    self._playerViewController?.removeFromParent()
                    self._playerViewController = nil
                    self._playerObserver.playerViewController = nil
                    self.usePlayerLayer()
                }
            }
        }
    }

    @objc
    func setShowNotificationControls(_ showNotificationControls: Bool) {
        _showNotificationControls = showNotificationControls

        guard let player = _player else {
            return
        }

        if showNotificationControls {
            NowPlayingInfoCenterManager.shared.registerPlayer(player: player)
        } else {
            NowPlayingInfoCenterManager.shared.removePlayer(player: player)
        }
    }

    @objc
    func setDisableAudioSessionManagement(_ disableAudioSessionManagement: Bool) {
        _disableAudioSessionManagement = disableAudioSessionManagement
    }

    @objc
    func setProgressUpdateInterval(_ progressUpdateInterval: Float) {
        _playerObserver.replaceTimeObserverIfSet(Float64(progressUpdateInterval))
    }

    func removePlayerLayer() {
        _playerLayer?.removeFromSuperlayer()
        _playerLayer = nil
        _playerObserver.playerLayer = nil
    }

    @objc
    func setSubtitleStyle(_ style: [String: Any]) {
        let subtitleStyle = SubtitleStyle.parse(from: style)
        _playerObserver.subtitleStyle = subtitleStyle
    }

    // MARK: - RCTVideoPlayerViewControllerDelegate

    func videoPlayerViewControllerWillDismiss(playerViewController: AVPlayerViewController) {
        if _playerViewController == playerViewController
            && _fullscreenPlayerPresented,
            let onVideoFullscreenPlayerWillDismiss {
            _playerObserver.removePlayerViewControllerObservers()
            onVideoFullscreenPlayerWillDismiss(["target": reactTag as Any])
        }
    }

    func videoPlayerViewControllerDidDismiss(playerViewController: AVPlayerViewController) {
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
    func setFilter(_ filterName: String!) {
        _filterName = filterName

        if !_filterEnabled {
            return
        } else if let uri = _source?.uri, uri.contains("m3u8") {
            return // filters don't work for HLS... return
        } else if _playerItem?.asset == nil {
            return
        }

        let filter: CIFilter! = CIFilter(name: filterName)
        Task {
            let composition = await RCTVideoUtils.generateVideoComposition(asset: _playerItem!.asset, filter: filter)
            self._playerItem?.videoComposition = composition
        }
    }

    @objc
    func setFilterEnabled(_ filterEnabled: Bool) {
        _filterEnabled = filterEnabled
    }

    // MARK: - RCTIMAAdsManager

    func getAdLanguage() -> String? {
        return _source?.adParams.adLanguage
    }

    func getAdTagUrl() -> String? {
        return _source?.adParams.adTagUrl
    }

    #if USE_GOOGLE_IMA
        func getContentPlayhead() -> IMAAVPlayerContentPlayhead? {
            return _contentPlayhead
        }
    #endif
    func setAdPlaying(_ adPlaying: Bool) {
        _adPlaying = adPlaying
    }

    // MARK: - React View Management

    func insertReactSubview(view: UIView!, atIndex: Int) {
        if _controls {
            view.frame = self.bounds
            _playerViewController?.contentOverlayView?.insertSubview(view, at: atIndex)
        } else {
            RCTLogError("video cannot have any subviews")
        }
        return
    }

    func removeReactSubview(subview: UIView!) {
        if _controls {
            subview.removeFromSuperview()
        } else {
            RCTLog("video cannot have any subviews")
        }
        return
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if _controls, let _playerViewController {
            _playerViewController.view.frame = bounds
            _playerViewController.view.setNeedsLayout()
            _playerViewController.view.layoutIfNeeded()

            // ensure content overlay also resizes
            _playerViewController.contentOverlayView?.frame = bounds

            // also adjust all subviews of contentOverlayView
            for subview in _playerViewController.contentOverlayView?.subviews ?? [] {
                subview.frame = bounds
            }

            // ensure preferredContentSize is set when in fullscreen
            if _fullscreenPlayerPresented {
                _playerViewController.preferredContentSize = CGSize(width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height)
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
        self._player?.replaceCurrentItem(with: nil)
        if let player = _player {
            player.pause()
            NowPlayingInfoCenterManager.shared.removePlayer(player: player)
        }

        // Unregister from AudioSessionManager
        AudioSessionManager.shared.unregisterView(view: self)

        _playerItem = nil
        _source = nil
        _chapters = nil
        _selectedTextTrackCriteria = SelectedTrackCriteria.none()
        _selectedAudioTrackCriteria = SelectedTrackCriteria.none()
        _presentingViewController = nil

        ReactNativeVideoManager.shared.onInstanceRemoved(id: instanceId, player: _player as Any)
        _player = nil
        _drmManager = nil
        _playerObserver.clearPlayer()

        self.removePlayerLayer()

        if let _playerViewController {
            _playerViewController.view.removeFromSuperview()
            _playerViewController.removeFromParent()
            _playerViewController.rctDelegate = nil
            _playerViewController.player = nil
            self._playerViewController = nil
            _playerObserver.playerViewController = nil
        }

        _eventDispatcher = nil
        // swiftlint:disable:next notification_center_detachment
        NotificationCenter.default.removeObserver(self)

        super.removeFromSuperview()
    }

    // MARK: - Export

    @objc
    func save(_ options: NSDictionary!, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
        RCTVideoSave.save(
            options: options,
            resolve: resolve,
            reject: reject,
            playerItem: _playerItem
        )
    }

    func setLicenseResult(_ license: String, _ licenseUrl: String) {
        _drmManager?.setJSLicenseResult(license: license, licenseUrl: licenseUrl)
    }

    func setLicenseResultError(_ error: String, _ licenseUrl: String) {
        _drmManager?.setJSLicenseError(error: error, licenseUrl: licenseUrl)
    }

    // MARK: - RCTPlayerObserverHandler

    func handleTimeUpdate(time _: CMTime) {
        sendProgressUpdate()
    }

    func handleReadyForDisplay(changeObject _: Any, change _: NSKeyValueObservedChange<Bool>) {
        if _isBuffering {
            _isBuffering = false
        }
        onReadyForDisplay?([
            "target": reactTag as Any,
        ])
    }

    // When timeMetadata is read the event onTimedMetadata is triggered
    func handleTimeMetadataChange(timedMetadata: [AVMetadataItem]) {
        guard onTimedMetadata != nil else { return }

        var metadata: [[String: String?]?] = []
        for item in timedMetadata {
            let value = item.value as? String
            let identifier = item.identifier?.rawValue

            if let value {
                metadata.append(["value": value, "identifier": identifier])
            }
        }

        onTimedMetadata?([
            "target": reactTag as Any,
            "metadata": metadata,
        ])
    }

    // Handle player item status change.
    func handlePlayerItemStatusChange(playerItem _: AVPlayerItem, change _: NSKeyValueObservedChange<AVPlayerItem.Status>) {
        guard let _playerItem else {
            return
        }

        if _playerItem.status == .readyToPlay {
            handleReadyToPlay()
        } else if _playerItem.status == .failed {
            handlePlaybackFailed()
        }
    }

    func extractJsonWithIndex(from tracks: [TextTrack]) -> [NSDictionary]? {
        if tracks.isEmpty {
            // No tracks, need to return nil to handle
            return nil
        }
        // Map each enumerated pair to include the index in the json dictionary
        let mappedTracks = tracks.enumerated().compactMap { index, track -> NSDictionary? in
            guard let json = track.json?.mutableCopy() as? NSMutableDictionary else { return nil }
            json["index"] = index // Insert the index into the json dictionary
            return json
        }
        return mappedTracks
    }

    func handleReadyToPlay() {
        guard let _playerItem else { return }
        guard let source = _source else { return }
        Task {
            if self._pendingSeek {
                self.setSeek(NSNumber(value: self._pendingSeekTime), NSNumber(value: 100))
                self._pendingSeek = false
            }

            if self._startPosition >= 0 {
                self.setSeek(NSNumber(value: self._startPosition), NSNumber(value: 100))
                self._startPosition = -1
            }

            if onVideoLoad != nil, self._videoLoadStarted {
                var duration = Float(CMTimeGetSeconds(_playerItem.asset.duration))

                if duration.isNaN || duration == 0 {
                    // This is a safety check for live video.
                    // AVPlayer report a 0 duration
                    duration = RCTVideoUtils.calculateSeekableDuration(_player).floatValue
                    if duration.isNaN {
                        duration = 0
                    }
                }

                var width: Float = 0
                var height: Float = 0
                var orientation = "undefined"

                let tracks = await RCTVideoAssetsUtils.getTracks(asset: _playerItem.asset, withMediaType: .video)
                let presentationSize = _playerItem.presentationSize
                if presentationSize.height != 0.0 {
                    width = Float(presentationSize.width)
                    height = Float(presentationSize.height)
                } else if let videoTrack = tracks?.first {
                    let naturalSize = videoTrack.naturalSize
                    width = Float(naturalSize.width)
                    height = Float(naturalSize.height)
                }
                orientation = width > height ? "landscape" : width == height ? "square" : "portrait"

                let audioTracks = await RCTVideoUtils.getAudioTrackInfo(self._player)
                let textTracks = await RCTVideoUtils.getTextTrackInfo(self._player)
                self.onVideoLoad?(["duration": NSNumber(value: duration),
                                   "currentTime": NSNumber(value: Float(CMTimeGetSeconds(_playerItem.currentTime()))),
                                   "canPlayReverse": NSNumber(value: _playerItem.canPlayReverse),
                                   "canPlayFastForward": NSNumber(value: _playerItem.canPlayFastForward),
                                   "canPlaySlowForward": NSNumber(value: _playerItem.canPlaySlowForward),
                                   "canPlaySlowReverse": NSNumber(value: _playerItem.canPlaySlowReverse),
                                   "canStepBackward": NSNumber(value: _playerItem.canStepBackward),
                                   "canStepForward": NSNumber(value: _playerItem.canStepForward),
                                   "naturalSize": [
                                       "width": width,
                                       "height": height,
                                       "orientation": orientation,
                                   ],
                                   "audioTracks": audioTracks,
                                   "textTracks": extractJsonWithIndex(from: source.textTracks) ?? textTracks.map(\.json),
                                   "target": self.reactTag as Any])
            }

            self._videoLoadStarted = false
            self._playerObserver.attachPlayerEventListeners()
            self.applyModifiers()
        }
    }

    func handlePlaybackFailed() {
        if let player = _player {
            NowPlayingInfoCenterManager.shared.removePlayer(player: player)
        }

        guard let _playerItem else { return }
        onVideoError?(
            [
                "error": [
                    "code": NSNumber(value: (_playerItem.error! as NSError).code),
                    "localizedDescription": _playerItem.error?.localizedDescription == nil ? "" : _playerItem.error?.localizedDescription as Any,
                    "localizedFailureReason": ((_playerItem.error! as NSError).localizedFailureReason == nil ?
                        "" : (_playerItem.error! as NSError).localizedFailureReason) ?? "",
                    "localizedRecoverySuggestion": ((_playerItem.error! as NSError).localizedRecoverySuggestion == nil ?
                        "" : (_playerItem.error! as NSError).localizedRecoverySuggestion) ?? "",
                    "domain": (_playerItem.error as! NSError).domain,
                ],
                "target": reactTag as Any,
            ]
        )
    }

    func handlePlaybackBufferKeyEmpty(playerItem _: AVPlayerItem, change: NSKeyValueObservedChange<Bool>) {
        if !_isBuffering && change.newValue == true {
            _isBuffering = true
        }
    }

    // Continue playing (or not if paused) after being paused due to hitting an unbuffered zone.
    func handlePlaybackLikelyToKeepUp(playerItem _: AVPlayerItem, change _: NSKeyValueObservedChange<Bool>) {
        if _isBuffering {
            _isBuffering = false
        }
    }

    func handleTimeControlStatusChange(player: AVPlayer, change: NSKeyValueObservedChange<AVPlayer.TimeControlStatus>) {
        if player.timeControlStatus == change.oldValue && change.oldValue != nil {
            return
        }
        guard [.paused, .playing].contains(player.timeControlStatus) else {
            return
        }
        let isPlaying = player.timeControlStatus == .playing

        guard _isPlaying != isPlaying else { return }
        _isPlaying = isPlaying
        if _controls {
            _paused = !isPlaying
        }
        onVideoPlaybackStateChanged?(["isPlaying": isPlaying, "isSeeking": self._pendingSeek == true, "target": reactTag as Any])
    }

    func handlePlaybackRateChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>) {
        guard let _player else { return }

        if player.rate == change.oldValue && change.oldValue != nil {
            return
        }

        onPlaybackRateChange?(["playbackRate": NSNumber(value: _player.rate),
                               "target": reactTag as Any])

        if _playbackStalled && _player.rate > 0 {
            onPlaybackResume?(["playbackRate": NSNumber(value: _player.rate),
                               "target": reactTag as Any])
            _playbackStalled = false
        }
    }

    func handleVolumeChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>) {
        guard let _player, onVolumeChange != nil else { return }

        if player.rate == change.oldValue && change.oldValue != nil {
            return
        }

        onVolumeChange?(["volume": NSNumber(value: _player.volume),
                         "target": reactTag as Any])
    }

    func handleExternalPlaybackActiveChange(player _: AVPlayer, change _: NSKeyValueObservedChange<Bool>) {
        #if !os(visionOS)
            guard let _player else { return }
            if !_playInBackground && UIApplication.shared.applicationState == .background {
                _playerLayer?.player = nil
                _playerViewController?.player = nil
            }
            guard onVideoExternalPlaybackChange != nil else { return }
            onVideoExternalPlaybackChange?(["isExternalPlaybackActive": NSNumber(value: _player.isExternalPlaybackActive),
                                            "target": reactTag as Any])
        #endif
    }

    func handleViewControllerOverlayViewFrameChange(overlayView _: UIView, change: NSKeyValueObservedChange<CGRect>) {
        let oldRect = change.oldValue
        let newRect = change.newValue

        guard let bounds = RCTVideoUtils.getCurrentWindow()?.bounds else { return }

        if !oldRect!.equalTo(newRect!) {
            if let reactVC = self.reactViewController() {
                reactVC.view.frame = bounds
                reactVC.view.setNeedsLayout()
            }
        }
    }

    func handleWillEnterFullScreen() {
        self.onVideoFullscreenPlayerWillPresent?(["target": self.reactTag as Any])
    }

    func handleDidEnterFullScreen() {
        self.onVideoFullscreenPlayerDidPresent?(["target": self.reactTag as Any])
    }

    func handleWillExitFullScreen() {
        self.onVideoFullscreenPlayerWillDismiss?(["target": self.reactTag as Any])
    }

    func handleDidExitFullScreen() {
        self.onVideoFullscreenPlayerDidDismiss?(["target": self.reactTag as Any])
    }

    @objc
    func handleDidFailToFinishPlaying(notification: NSNotification!) {
        guard onVideoError != nil else { return }

        let error: NSError! = notification.userInfo?[AVPlayerItemFailedToPlayToEndTimeErrorKey] as? NSError
        onVideoError?(
            [
                "error": [
                    "code": NSNumber(value: (error as NSError).code),
                    "localizedDescription": error.localizedDescription,
                    "localizedFailureReason": (error as NSError).localizedFailureReason ?? "",
                    "localizedRecoverySuggestion": (error as NSError).localizedRecoverySuggestion ?? "",
                    "domain": (error as NSError).domain,
                ],
                "target": reactTag as Any,
            ]
        )
    }

    @objc
    func handlePlaybackStalled(notification _: NSNotification!) {
        onPlaybackStalled?(["target": reactTag as Any])
        _playbackStalled = true
    }

    @objc
    func handlePlayerItemDidReachEnd(notification: NSNotification!) {
        sendProgressUpdate(didEnd: true)
        onVideoEnd?(["target": reactTag as Any])
        #if USE_GOOGLE_IMA
            if notification.object as? AVPlayerItem == _player?.currentItem {
                _imaAdsManager.getAdsLoader()?.contentComplete()
            }
        #endif
        if _repeat {
            let item: AVPlayerItem! = notification.object as? AVPlayerItem

            item.seek(
                to: _source?.cropStart != nil ? CMTime(value: _source!.cropStart!, timescale: 1000) : CMTime.zero,
                toleranceBefore: CMTime.zero,
                toleranceAfter: CMTime.zero,
                completionHandler: { [weak self] _ in
                    guard let self else { return }
                    self.applyModifiers()
                }
            )
        } else {
            _player?.pause()
            _player?.rate = 0.0
        }
    }

    @objc
    func handleAVPlayerAccess(notification: NSNotification!) {
        guard onVideoBandwidthUpdate != nil else { return }

        guard let accessLog = (notification.object as? AVPlayerItem)?.accessLog() else {
            return
        }
        guard let lastEvent = accessLog.events.last else { return }
        if lastEvent.indicatedBitrate != _lastBitrate {
            _lastBitrate = lastEvent.indicatedBitrate
            onVideoBandwidthUpdate?(["bitrate": _lastBitrate, "target": reactTag as Any])
        }
    }

    func handleTracksChange(playerItem _: AVPlayerItem, change _: NSKeyValueObservedChange<[AVPlayerItemTrack]>) {
        guard let source = _source else { return }
        if onTextTracks != nil {
            Task {
                let textTracks = await RCTVideoUtils.getTextTrackInfo(self._player)
                self.onTextTracks?(["textTracks": extractJsonWithIndex(from: source.textTracks) ?? textTracks.compactMap(\.json)])
            }
        }

        if onAudioTracks != nil {
            Task {
                let audioTracks = await RCTVideoUtils.getAudioTrackInfo(self._player)
                self.onAudioTracks?(["audioTracks": audioTracks])
            }
        }
    }

    func handleLegibleOutput(strings: [NSAttributedString]) {
        guard onTextTrackDataChanged != nil else { return }

        if let subtitles = strings.first {
            self.onTextTrackDataChanged?(["subtitleTracks": subtitles.string])
        }
    }

    @objc
    func getCurrentPlaybackTime(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
        if let player = _playerItem {
            let currentTime = RCTVideoUtils.getCurrentTime(playerItem: player)
            resolve(currentTime)
        } else {
            reject("PLAYER_NOT_AVAILABLE", "Player is not initialized.", nil)
        }
    }

    @objc
    func enterPictureInPicture() {
        if _pip?._pipController == nil {
            initPictureinPicture()
            if #available(iOS 9.0, tvOS 14.0, *) {
                _playerViewController?.allowsPictureInPicturePlayback = true
            }
        }
        _pip?.enterPictureInPicture()
    }

    @objc
    func exitPictureInPicture() {
        guard isPictureInPictureActive() else { return }

        _pip?.exitPictureInPicture()
        if _enterPictureInPictureOnLeave {
            initPictureinPicture()
            if #available(iOS 9.0, tvOS 14.0, *) {
                _playerViewController?.allowsPictureInPicturePlayback = true
            }
        } else {
            _pip?.deinitPipController()
            if #available(iOS 9.0, tvOS 14.0, *) {
                _playerViewController?.allowsPictureInPicturePlayback = false
            }
        }
    }

    // Workaround for #3418 - https://github.com/TheWidlarzGroup/react-native-video/issues/3418#issuecomment-2043508862
    @objc
    func setOnClick(_: Any) {}
}
