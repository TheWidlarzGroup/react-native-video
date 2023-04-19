//
//  RCTPlaybackController.swift
//  react-native-video
//
//  Created by 206753751 on 3/30/23.
//

import Foundation
import AVFoundation
import AVKit
import MediaPlayer

//MARK: Extensions
extension UIColor {
    static let lighterGray = UIColor(red: 254, green: 255, blue: 253, alpha: 1)
}

//MARK: Class variables
class RCTPlaybackController: UIView, AVRoutePickerViewDelegate {
    private var _isAdDisplaying = false // Advertisements play status
    private var _isAdPlaying = true
    private var _isContentPlaying = false // Content play status
    private var _isSeeking: Bool = false
    private var _isTracking: Bool = false // Is dragging seekbar
    private var _isVisible = false
    private var _playerItemContext = 0
    private var _timeObserverToken: Any?
    private var _video: RCTVideo?
    private var _visibilityTimer: Timer?

    
    //Elements
    private var airplayView: AVRoutePickerView = AVRoutePickerView()
    private var bottomControlStack: UIStackView = UIStackView()
    private var centerControlStack: UIView = UIView()
    private var curTimeLabel: UILabel = UILabel()
    private var durTimeLabel: UILabel = UILabel()
    private var fullscreenButtonTop: UIButton = UIButton()
    private var gradienceLayer: CAGradientLayer = CAGradientLayer()
    private var iconBundle: Bundle? = Bundle()
    private var mainStack: UIStackView = UIStackView()
    private var playButton: UIButton = UIButton()
    private var seekBar: UISlider = UISlider()
    private var topControlStack: UIStackView = UIStackView()



    
    //MARK: Helper variables
    private var _player : AVPlayer? {
        return self._video?._player
    }
    
    private var _playerItem : AVPlayerItem? {
        return self._video?._playerItem
    }
    
    var isPlaying: Bool {
        return self._video?._player?.rate != 0 && _player?.error == nil
    }
    
    var isFullscreen: Bool {
        return self._video?._fullscreenPlayerPresented == true
    }
    
    //MARK: Initialize UI elements
    func initAirplayView(){
        airplayView.tintColor = .lighterGray
        airplayView.prioritizesVideoDevices = true
    }
    
    func initBottomControlStack(){
        bottomControlStack.axis = .horizontal
        bottomControlStack.spacing = 10
        bottomControlStack.isLayoutMarginsRelativeArrangement = true
        bottomControlStack.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10)
        bottomControlStack.alpha = 0
        
        bottomControlStack.addArrangedSubview(playButton)
        bottomControlStack.addArrangedSubview(curTimeLabel)
        bottomControlStack.addArrangedSubview(seekBar)
        bottomControlStack.addArrangedSubview(durTimeLabel)
        // bottomControlStack.addArrangedSubview(airplayView)
    }
    
    func initCenterControlStack(){
        // Hide controls when tapping center controller
        let gesture:UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(hideControls))
        gesture.numberOfTapsRequired = 1
        gesture.cancelsTouchesInView = false
        centerControlStack.addGestureRecognizer(gesture)
    }
    
    func initCurTimeLabel(){
        curTimeLabel.text = "--:--"
        curTimeLabel.textColor = UIColor.white
        curTimeLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Width constraint
        curTimeLabel.addConstraint(NSLayoutConstraint(item: curTimeLabel, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 47))
        curTimeLabel.lineBreakMode = .byClipping
    }
    
    func initDurTimeLabel(){
        durTimeLabel.text = "--:--"
        durTimeLabel.textColor = UIColor.white
        
        // Width constraint
        durTimeLabel.addConstraint(NSLayoutConstraint(item: durTimeLabel, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 47))
        durTimeLabel.lineBreakMode = .byClipping
    }
    
    func initFullscreenButtonTop(){
        fullscreenButtonTop.tintColor = .white
        
        // Width constraint
        fullscreenButtonTop.translatesAutoresizingMaskIntoConstraints = false
        fullscreenButtonTop.addConstraint(NSLayoutConstraint(item: fullscreenButtonTop, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        fullscreenButtonTop.addConstraint(NSLayoutConstraint(item: fullscreenButtonTop, attribute: .height, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        
        fullscreenButtonTop.setImage(UIImage(named: "fullscreen", in: iconBundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .normal)
        fullscreenButtonTop.setImage(UIImage(named: "fullscreen_exit", in: iconBundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .selected)
        
        fullscreenButtonTop.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
    }
    
    func initGradienceLayer(){
        gradienceLayer.colors = [
            UIColor.black.cgColor,
            UIColor.black.withAlphaComponent(0.7),
            UIColor.black.withAlphaComponent(0),
            UIColor.black.withAlphaComponent(0.7),
            UIColor.black.cgColor
        ]
        
        gradienceLayer.locations = [0.0, 0.3, 0.5, 0.7, 1.0]
        gradienceLayer.startPoint = CGPoint(x : 0.0, y : 0)
        gradienceLayer.endPoint = CGPoint(x :0.0, y: 1.0)
        gradienceLayer.opacity = 0
    }
    
    func initIconBundle(){
        let podBundle = Bundle(for: Self.self) // for getting pod url
        if let url = podBundle.url(forResource: "IconBundle", withExtension: "bundle") {
            iconBundle = Bundle.init(url: url)
        }
    }
    
    func initMainStack(){
        mainStack.axis  = .vertical
        mainStack.alignment = .fill
        mainStack.distribution = .fill
        mainStack.translatesAutoresizingMaskIntoConstraints = false
        mainStack.insetsLayoutMarginsFromSafeArea = true
        
        mainStack.layer.addSublayer(gradienceLayer)
        mainStack.addArrangedSubview(topControlStack)
        mainStack.addArrangedSubview(centerControlStack)
        mainStack.addArrangedSubview(bottomControlStack)
        mainStack.isUserInteractionEnabled = true
        self.addSubview(self.mainStack)
    }
    
    func initPlayButton(){
        playButton.tintColor = .white
        
        // Width constraint
        playButton.translatesAutoresizingMaskIntoConstraints = false
        playButton.addConstraint(NSLayoutConstraint(item: playButton, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        playButton.addConstraint(NSLayoutConstraint(item: playButton, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        
        playButton.setImage(UIImage(named: "play", in: iconBundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .normal)
        playButton.setImage(UIImage(named: "pause", in: iconBundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .selected)
        
        playButton.addTarget(self, action: #selector(togglePaused), for: .touchUpInside)
    }
    
    func initPlayerListeners(){
        _timeObserverToken = _player?.addPeriodicTimeObserver(forInterval: CMTime(value: CMTimeValue(1), timescale: 2), queue: DispatchQueue.main) {[weak self] (progressTime) in
            self?.onProgress(progressTime: progressTime)
        }
        
        // Register as an observer of the player item's status property
        self._playerItem?.addObserver(self,
           forKeyPath: #keyPath(AVPlayerItem.status),
           options: [.old, .new],
           context: nil)
        
        self._player?.addObserver(
            self,
            forKeyPath: "timeControlStatus",
            options: [.old, .new],
            context: nil)
        
        self._player?.addObserver(
            self,
            forKeyPath: "rate",
            options: [.old, .new],
            context: nil)
    }
    
    func initSeekBar(){
        seekBar.value = 0.0
        seekBar.isContinuous = true
        
        // Styling
        seekBar.minimumTrackTintColor = .lighterGray
        seekBar.maximumTrackTintColor = .darkGray
        seekBar.thumbTintColor = .lighterGray
        
        seekBar.addTarget(self, action: #selector(onSeekbarChange(slider:event:)), for: .valueChanged)
    }
    
    func initTopControlStack(){
        topControlStack.axis = .horizontal
        topControlStack.spacing = 10
        topControlStack.isLayoutMarginsRelativeArrangement = true
        topControlStack.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10)
        
        topControlStack.addArrangedSubview(fullscreenButtonTop)
        topControlStack.addArrangedSubview(UIView())
    }
    
    //MARK: UIView functions
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    init(video: RCTVideo) {
        self._video = video
        super.init(frame: .zero)
        
        // Initialize dependencies
        self.initIconBundle()
        
        // Initialize UI stacks
        self.initMainStack()
        self.initTopControlStack()
        self.initCenterControlStack()
        self.initBottomControlStack()
        
        // Initialize UI elements
        self.initSeekBar()
        self.initGradienceLayer()
        self.initCurTimeLabel()
        self.initDurTimeLabel()
        self.initPlayButton()
        self.initFullscreenButtonTop()
        self.initAirplayView()
        
        // Initialize listeners and delegates
        self.clearPlayerListeners()
        self.initPlayerListeners()
        airplayView.delegate = self

        // Display playback controls
        self.showControls()
    }
    
    //MARK: Override/delegate/callback functions
    override func layoutSubviews(){
        super.layoutSubviews()
        
        // also adjust all subviews of contentOverlayView
        for subview in subviews ?? [] {
            subview.frame = bounds
        }
        
        for layer in mainStack.layer.sublayers ?? []{
            gradienceLayer.frame = bounds
        }
        
        NSLayoutConstraint.activate([
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 0),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: 0),
            mainStack.topAnchor.constraint(equalTo: topAnchor, constant: 0),
            mainStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: 0),
        ])
    }
    
    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey : Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        DispatchQueue.main.async {
            self.onPlayerEvent(keyPath: keyPath, change: change)
        }
    }
    
    func onPlayerEvent(keyPath: String?, change: [NSKeyValueChangeKey : Any]?){
        guard let _player = _player else { return }
        setUi_forceRefresh()
        
        switch (keyPath) {
        case "timeControlStatus":
            let status = _player.timeControlStatus

            if status == .playing {
                setContentPlayStatus(playing: true)
            }else if status == .paused {
                setContentPlayStatus(playing: false)
            }
            break
            
        case "rate":
            if _player.rate > 0 {
                setContentPlayStatus(playing: true)
            }else{
                setContentPlayStatus(playing: false)
            }
            break
            
        case #keyPath(AVPlayerItem.status):
            let status: AVPlayerItem.Status
            if let statusNumber = change?[.newKey] as? NSNumber {
                status = AVPlayerItem.Status(rawValue: statusNumber.intValue)!
            } else {
                status = .unknown
            }
            
            // Switch over status value
            switch status {
            case .readyToPlay:
                // Player item is ready to play.
                print("readyToPlay")
                break
            case .failed:
                // Player item failed. See error.
                print("failed")
                break
            case .unknown:
                // Player item is not ready.
                print("unknown")
                break
            }
            break
        default:
            break
        }
    }
    
    func onProgress(progressTime: CMTime){
        var duration:CMTime? = self._player?.currentItem?.asset.duration
        
        let isLive: Bool = self.isPlayerLive(duration: duration ?? CMTime.indefinite)
        var progressFloat: Float = Float(CMTimeGetSeconds(progressTime))
        var durationFloat: Float = Float(CMTimeGetSeconds(duration ?? CMTime(value: 0, timescale: 1))) ?? progressFloat
        
        var secondsFromSeekStart : Float = 0.0
        if(isLive){
            let liveData = self.getLiveDuration()
            durationFloat = liveData.livePosition
            secondsFromSeekStart = liveData.secondsFromSeekStart > 0 ? liveData.secondsFromSeekStart : 0.0
            self.seekBar.minimumValue = liveData.seekableStart
            self.seekBar.maximumValue = durationFloat
        }else{
            self.seekBar.minimumValue = 0
            self.seekBar.maximumValue = durationFloat
        }
        
        // Update UI when user is not dragging or seeking
        if(self._isTracking == false && self._isSeeking == false){
            let isAnimated = isLive ? false : true
            self.seekBar.setValue(progressFloat, animated: isAnimated)
            self.setUi_currentTime(seconds: isLive ? secondsFromSeekStart : progressFloat)
            self.setUi_durationTime(seconds: durationFloat)
        }
    }
    
    @objc func onSeekbarChange(slider: UISlider, event: UIEvent) {
        if let touchEvent = event.allTouches?.first {
                switch touchEvent.phase {
                case .began:
                    // Start slider interaction
                    curTimeLabel.alpha = 0.4
                    self._isTracking = true
                    invalidateVisibilityTimer()
                    break

                case .moved:
                    // handle drag moved
                    if(self.isPlayerLive(duration: nil)){
                        let liveData = getLiveDuration()
                        let seekableStart = liveData.seekableStart
                        let seekTime = slider.value - seekableStart
                        self.setUi_currentTime(seconds: seekTime > 0 ? seekTime : 0.0)
                    }else{
                        self.setUi_currentTime(seconds: slider.value)
                    }
                    break

                case .ended:
                    // End slider interaction
                    resetVisibilityTimer()
                    curTimeLabel.alpha = 1
                    self._isTracking = false
                    
                    //Seek to slider value
                    guard let duration = _player?.currentItem?.duration else { return }
                    manualSeekToProgress(seconds: Float(slider.value))
                    break
                default:
                    break
                }
            }
    }
    
    func routePickerViewDidEndPresentingRoutes(_ routePickerView: AVRoutePickerView){
        showControls()
        toggleControlVisibility(visible: true, timerInterval: 8.0)
    }
    
    
    
    //MARK: Playback functions
    func clearPlayerListeners(){
        if let timeObserverToken = _timeObserverToken {
            _player?.removeTimeObserver(timeObserverToken)
            self._timeObserverToken = nil
        }
    }
    
    func getLiveDuration() -> (
        livePosition: Float,
        seekableStart: Float,
        seekableEnd: Float,
        seekableDuration: Float,
        secondsBehindLive: Float,
        secondsFromSeekStart: Float
    ){
        var livePosition: Float = 0.0;
        var seekableStart: Float = 0.0;
        var seekableEnd: Float = 0.0;
        var seekableDuration: Float = 0.0;
        var secondsBehindLive: Float = 0.0;
        var secondsFromSeekStart: Float = 0.0;
        if let items = _player?.currentItem?.seekableTimeRanges {
            if(!items.isEmpty) {
                let range = items[items.count - 1]
                let timeRange = range.timeRangeValue
                let currentTime = Float(_player?.currentTime().seconds ?? 0.0)
                seekableStart = Float(CMTimeGetSeconds(timeRange.start))
                seekableEnd = Float(CMTimeGetSeconds(timeRange.end))
                seekableDuration = Float(CMTimeGetSeconds(timeRange.duration))
                livePosition = Float(seekableStart + seekableDuration) //
                secondsBehindLive = currentTime - seekableDuration - seekableStart
                
                secondsFromSeekStart = currentTime - seekableStart
            }
        }
        return (livePosition, seekableStart, seekableEnd, seekableDuration, secondsBehindLive, secondsFromSeekStart);
    }
    
    @objc func hideControls() {
        toggleControlVisibility(visible: false)
    }
    
    func invalidateVisibilityTimer(){
        _visibilityTimer?.invalidate()
    }
    
    func isPlayerLive(duration: CMTime?) -> Bool {
        var duration: CMTime? = duration
        if(duration == nil){
            duration = _player?.currentItem?.duration
        }
        
        let isLive: Bool = CMTIME_IS_INDEFINITE(duration ?? CMTime.indefinite)
        return isLive
    }
    
    func manualSeekToProgress(seconds: Float){
        self._isSeeking = true
        let seekTime = CMTime(value: CMTimeValue(seconds), timescale: 1)
        self._playerItem?.seek(
            to: seekTime,
            toleranceBefore: CMTimeMake(value: 1,timescale: 1),
            toleranceAfter: CMTimeMake(value: 1,timescale: 1)
        ){ [weak self] _ in
            guard let `self` = self else { return }
            self._isSeeking = false
        }
        print("Seeking to time(s): \(seconds)")
    }
    
    func numToString(myInt: Int) -> String{
        return String(format: "%02d", myInt)
    }
    
    // Hide playback controls after a given time (defaulted to 4s)
    func resetVisibilityTimer(_timeInterval: Double? = nil) {
        var timeInterval : Double = _timeInterval != nil ? _timeInterval! : 4.0
        invalidateVisibilityTimer()
        _visibilityTimer = Timer.scheduledTimer(timeInterval: timeInterval, target: self, selector: #selector(hideControls), userInfo: nil, repeats: false)
    }
    
    func secondsToTimeLabel(_ seconds: Float) -> String {
        if(seconds.isNaN){
            return "NaN"
        }
        
        var secondsInt = Int(seconds)
        var isNegative = false
        var outputString = ""
        
        // Handle negative values
        if(secondsInt < 0){
            secondsInt = abs(secondsInt)
            outputString = "-"
        }
        
        // Add hours if applicable (hh:)
        if(seconds > 3600){
            let h1 = numToString(myInt: secondsInt / 3600)
            outputString.append("\(h1):")
        }
        
        // Add minutes and seconds (mm:ss)
        let m1 = numToString(myInt: (secondsInt % 3600) / 60)
        let s1 = numToString(myInt: (secondsInt % 3600) % 60)
        outputString.append("\(m1):\(s1)")
        
        return outputString
    }
    
    func setAdPlaying(playing: Bool){
        _isAdPlaying = playing
        if(_isAdDisplaying){
            setUI_isPlaying(_isPlaying: playing)
        }
    }
    
    func setContentPlayStatus(playing: Bool){
        _isContentPlaying = playing
        if(!_isAdDisplaying){
            setUI_isPlaying(_isPlaying: playing)
        }
    }
    
    @objc func showControls() {
        toggleControlVisibility(visible: true)
    }
    
    // Toggle playback controls by passing visible: nil
    func toggleControlVisibility(visible: Bool?, timerInterval: Double? = nil) {
        var isVisible: Bool = visible ?? !_isVisible
        _isVisible = isVisible
        
        // Animate opacity
        let alpha : CGFloat = isVisible ? 1.0: 0.0
        let opacity : Float = isVisible ? 1.0: 0.0
        UIView.animate(withDuration: 0.2) {
            self.bottomControlStack.alpha = alpha
            self.topControlStack.alpha = alpha
            self.gradienceLayer.opacity = opacity
        }
        
        // Disable user interactions
        topControlStack.isUserInteractionEnabled = isVisible
        bottomControlStack.isUserInteractionEnabled = isVisible
        self.isUserInteractionEnabled = isVisible
        
        // Reset Timer
        resetVisibilityTimer(_timeInterval: timerInterval)
    }
    
    @objc func togglePaused(){
        guard let _video = _video else { return }
        let toggleValue = _isAdDisplaying == true ? _isAdPlaying: isPlaying
        _video.setPaused(toggleValue)
    }
    
    @objc func toggleFullscreen(){
        if(isFullscreen){
            _video?.setFullscreen(false)
        }else{
            _video?.setFullscreen(true)
        }
    }
    
    //MARK: UI setters
    func setUi_currentTime(seconds: Float){
        self.curTimeLabel.text = secondsToTimeLabel(seconds)
    }
    
    func setUi_durationTime(seconds: Float){
        if(self.isPlayerLive(duration: nil)){
            self.durTimeLabel.text = "Live"
        }else{
            self.durTimeLabel.text = secondsToTimeLabel(seconds)
        }
    }
    
    func setUI_isAdDisplaying(adDisplayed: Bool){
        _isAdDisplaying = adDisplayed
        
        // Disable seekbar when ad is displayed
        seekBar.isEnabled = !adDisplayed
        
        //Hide controls when ad is displayed
        if(adDisplayed){
            hideControls()
        }
        
        setUi_forceRefresh()
    }
    
    func setUI_isFullscreen(_isFullscreen: Bool){
        fullscreenButtonTop.isSelected = _isFullscreen
    }
    
    func setUI_isPlaying(_isPlaying: Bool){
        playButton.isSelected = _isPlaying
    }
    
    // Manually refresh the UI with updated player states
    @objc func setUi_forceRefresh(){
        setUI_isPlaying(_isPlaying: _isAdDisplaying ? _isAdPlaying : _isContentPlaying)
        setUI_isFullscreen(_isFullscreen: isFullscreen)
    }
}
