//
//  RCTPlaybackController.swift
//  react-native-video
//
//  Created by 206753751 on 3/30/23.
//

import Foundation
import AVFoundation
import AVKit


class RCTPlaybackController: UIView {
    private var playerItemContext = 0
    private var timeObserverToken: Any?
    private var _video: RCTVideo?
    private var visibilityTimer: Timer?
    
    private var _player : AVPlayer? {
        return self._video?._player
    }
    
    private var _playerItem : AVPlayerItem? {
        return self._video?._playerItem
    }
    
    private var _isAdPlaying = true
    private var _isAdDisplaying = false // Advertisments play status
    private var _isContentPlaying = false // Normal content play status
    
    var isPlaying: Bool {
        return self._video?._player?.rate != 0 && _player?.error == nil
    }
    
    var isFullscreen: Bool {
        return self._video?._fullscreenPlayerPresented == true
    }
    
    var isTracking: Bool = false
    var isSeeking: Bool = false
    
    private var seekBar: UISlider = {
        let bar = UISlider()
        bar.value = 0.0
        bar.isContinuous = true
        
        // Styling
        bar.minimumTrackTintColor = .red
        bar.maximumTrackTintColor = .darkGray
        bar.thumbTintColor = .red
        return bar
    }()
    
    func invalidateControlsTimer(){
        visibilityTimer?.invalidate()
    }
    
    func resetControlsTimer() {
        invalidateControlsTimer()
        visibilityTimer = Timer.scheduledTimer(timeInterval: 4.0, target: self, selector: #selector(hideControls), userInfo: nil, repeats: false)
    }
    
    @objc func hideControls() {
        toggleControlVisibility(visible: false)
    }
    
    @objc func showControls() {
        toggleControlVisibility(visible: true)
    }
    
    @objc func toggleControlVisibility(visible: Bool) {
        let alpha : CGFloat = visible ? 1.0: 0.0
        let opacity : Float = visible ? 1.0: 0.0
        UIView.animate(withDuration: 0.2) {
            self.bottomControlStack.alpha = alpha
            self.topControlStack.alpha = alpha
            self.gradienceLayer.opacity = opacity
        }
        topControlStack.isUserInteractionEnabled = visible
        bottomControlStack.isUserInteractionEnabled = visible
        resetControlsTimer()
    }
    
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
    
    var gradienceLayer: CAGradientLayer = {
        let gradient: CAGradientLayer = CAGradientLayer()

        gradient.colors = [
            UIColor.black.cgColor,
            UIColor.black.withAlphaComponent(0.7),
            UIColor.black.withAlphaComponent(0),
            UIColor.black.withAlphaComponent(0.7),
            UIColor.black.cgColor
        ]
        
        gradient.locations = [0.0, 0.3, 0.5, 0.7, 1.0]
        gradient.startPoint = CGPoint(x : 0.0, y : 0)
        gradient.endPoint = CGPoint(x :0.0, y: 1.0)
        gradient.opacity = 0
        
        return gradient
    }()
    
    var topControlStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.spacing = 10
        stackView.isLayoutMarginsRelativeArrangement = true
        stackView.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10)
        return stackView
    }()
    
    var bottomControlStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.spacing = 10
        stackView.isLayoutMarginsRelativeArrangement = true
        stackView.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10)
        stackView.alpha = 0
        return stackView
    }()
    
    var mainStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis  = .vertical
        stackView.alignment = .fill
        stackView.distribution = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.insetsLayoutMarginsFromSafeArea = true
        return stackView
    }()
    
    var playButton: UIButton = {
        let button = UIButton()
        
        // Width constraint
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        return button
    }()
    
    var fullscreenButton: UIButton = {
        let button = UIButton()
        button.tintColor = .white
        
        // Width constraint
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .height, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        return button
    }()
    
    var fullscreenButtonTop: UIButton = {
        let button = UIButton()
        
        // Width constraint
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .height, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 25))
        return button
    }()
    
    var curTimeLabel: UILabel = {
        let label = UILabel()
        label.text = "--:--"
        label.textColor = UIColor.white
        label.translatesAutoresizingMaskIntoConstraints = false
        
        // Width constraint
        label.addConstraint(NSLayoutConstraint(item: label, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 47))
        label.lineBreakMode = .byClipping
        return label
    }()
    
    
    var durTimeLabel: UILabel = {
        let label = UILabel()
        label.text = "--:--"
        label.textColor = UIColor.white
        
        // Width constraint
        label.addConstraint(NSLayoutConstraint(item: label, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 47))
        label.lineBreakMode = .byClipping
        return label
    }()
    
    func initTopControls(){
        topControlStack.addArrangedSubview(fullscreenButtonTop)
        topControlStack.addArrangedSubview(UIView())
        
        fullscreenButtonTop.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
    }
    
    func initIcons(){
        let podBundle = Bundle(for: Self.self) // for getting pod url
        if let url = podBundle.url(forResource: "IconBundle", withExtension: "bundle") {
            let bundle = Bundle.init(url: url)
            
            fullscreenButton.setImage(UIImage(named: "fullscreen", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .normal)
            fullscreenButton.setImage(UIImage(named: "fullscreen_exit", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .selected)
            
            fullscreenButtonTop.setImage(UIImage(named: "fullscreen", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .normal)
            fullscreenButtonTop.setImage(UIImage(named: "fullscreen_exit", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .selected)
            
            playButton.setImage(UIImage(named: "play", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .normal)
            playButton.setImage(UIImage(named: "pause", in: bundle, compatibleWith: nil)?.withTintColor(UIColor.white), for: .selected)
            
//          Verify if file exist in bundle
//          let exist = bundle?.path(forResource: "fullscreen", ofType: "png")
//          print("exist \(exist)")
        }
    }
    
    func initBottomControls(){
        bottomControlStack.addArrangedSubview(playButton)
        bottomControlStack.addArrangedSubview(curTimeLabel)
        bottomControlStack.addArrangedSubview(seekBar)
        bottomControlStack.addArrangedSubview(durTimeLabel)
        bottomControlStack.addArrangedSubview(fullscreenButton)
        
        
        playButton.addTarget(self, action: #selector(togglePaused), for: .touchUpInside)
        
        fullscreenButton.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
        
        // Listeners
        seekBar.addTarget(self, action: #selector(onSeekbarChange(slider:event:)), for: .valueChanged)
    }
    
    func initGestures(){
        let gesture:UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(showControls))
        gesture.numberOfTapsRequired = 1
        gesture.cancelsTouchesInView = false
        
        mainStack.addGestureRecognizer(gesture)
    }
    
    init(video: RCTVideo) {
        self._video = video
        super.init(frame: .zero)
        //self.backgroundColor = UIColor.green.withAlphaComponent(1)
        self.clearPlayerListeners()
        resetControlsTimer()

        self.initTopControls()
        self.initBottomControls()
        self.initIcons()
        
        let verticalSpacer = UIView()
        verticalSpacer.isUserInteractionEnabled = false
        
        // Add components to main stack
        mainStack.layer.addSublayer(gradienceLayer)
        mainStack.addArrangedSubview(topControlStack)
        mainStack.addArrangedSubview(verticalSpacer)
        mainStack.addArrangedSubview(bottomControlStack)
        mainStack.isUserInteractionEnabled = true
        self.addSubview(self.mainStack)
        
        self.initGestures()
        self.addPlayerListeners()
        
        // Display playback controls
        self.toggleControlVisibility(visible: true)
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    func manualSeekToProgress(seconds: Float){
        self.isSeeking = true
        let seekTime = CMTime(value: CMTimeValue(seconds), timescale: 1)
        self._playerItem?.seek(
            to: seekTime,
            toleranceBefore: CMTimeMake(value: 1,timescale: 1),
            toleranceAfter: CMTimeMake(value: 1,timescale: 1)
        ){ [weak self] _ in
            guard let `self` = self else { return }
            self.isSeeking = false
        }
        print("Seeking to time(s): \(seconds)")
    }
    
    @objc func onSeekbarChange(slider: UISlider, event: UIEvent) {
        if let touchEvent = event.allTouches?.first {
                switch touchEvent.phase {
                case .began:
                    // Start slider interaction
                    curTimeLabel.alpha = 0.4
                    self.isTracking = true
                    invalidateControlsTimer()
                    break

                case .moved:
                    // handle drag moved
                    self.updateCurrentTime(seconds: slider.value)
                    break

                case .ended:
                    // End slider interaction
                    resetControlsTimer()
                    curTimeLabel.alpha = 1
                    self.isTracking = false
                    
                    //Seek to slider value
                    guard let duration = _player?.currentItem?.duration else { return }
                    manualSeekToProgress(seconds: Float(slider.value))
                    break
                default:
                    break
                }
            }
        
        
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
    
    func setContentPlayStatus(playing: Bool){
        _isContentPlaying = playing
        if(!_isAdDisplaying){
            setUI_isPlaying(_isPlaying: playing)
        }
    }
    
    func setUI_isPlaying(_isPlaying: Bool){
        playButton.isSelected = _isPlaying
    }
    
    func setUI_isFullscreen(_isFullscreen: Bool){
        fullscreenButton.isSelected = _isFullscreen
        fullscreenButtonTop.isSelected = _isFullscreen
    }
    
    func setAdPlaying(playing: Bool){
        _isAdPlaying = playing
        if(_isAdDisplaying){
            setUI_isPlaying(_isPlaying: playing)
        }
    }
    
    func setUI_isAdDisplaying(isDisplayed: Bool){
        _isAdDisplaying = isDisplayed
        forceUIRefresh()
    }
    
    // Manually refresh the UI with up-to-date player states
    @objc func forceUIRefresh(){
        if(_isAdDisplaying){
            setUI_isPlaying(_isPlaying: _isAdPlaying)
        }else{
            setUI_isPlaying(_isPlaying: _isContentPlaying)
        }
        setUI_isFullscreen(_isFullscreen: isFullscreen)
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
    
    func clearPlayerListeners(){
        // Clear timeObserver
        if let timeObserverToken = timeObserverToken {
            _player?.removeTimeObserver(timeObserverToken)
            self.timeObserverToken = nil
        }
    }
    
    func numToString(myInt: Int) -> String{
        return String(format: "%02d", myInt)
    }
    
    func updateCurrentTime(seconds: Float){
        self.curTimeLabel.text = secondsToTimeLabel(seconds)
    }
    
    func updateDurationTime(seconds: Float, isLive: Bool){
        if(isLive){
            self.durTimeLabel.text = "Live"
        }else{
            self.durTimeLabel.text = secondsToTimeLabel(seconds)
        }
    }
    
    func getLiveDuration() -> (
        livePosition: Float,
        seekableStart: Float,
        seekableEnd: Float,
        seekableDuration: Float,
        secondsBehindLive: Float
    ){
        var livePosition: Float = 0.0;
        var seekableStart: Float = 0.0;
        var seekableEnd: Float = 0.0;
        var seekableDuration: Float = 0.0;
        var secondsBehindLive: Float = 0.0;
        if let items = _player?.currentItem?.seekableTimeRanges {
            if(!items.isEmpty) {
                let range = items[items.count - 1]
                let timeRange = range.timeRangeValue
                let currentTime = Float(_player?.currentTime().seconds ?? 0.0)
                seekableStart = Float(CMTimeGetSeconds(timeRange.start))
                seekableEnd = Float(CMTimeGetSeconds(timeRange.end))
                seekableDuration = Float(CMTimeGetSeconds(timeRange.duration))
                livePosition = Float(seekableStart + seekableDuration)
                secondsBehindLive = currentTime - seekableDuration - seekableStart
            }
        }
        return (livePosition, seekableStart, seekableEnd, seekableDuration, secondsBehindLive);
    }
    
    func addPlayerListeners(){
        timeObserverToken = _player?.addPeriodicTimeObserver(forInterval: CMTime(value: CMTimeValue(1), timescale: 2), queue: DispatchQueue.main) {[weak self] (progressTime) in
            //print("periodic time: \(CMTimeGetSeconds(progressTime))")
            //self?.updatePlaybackProgress(progressTime: progressTime)
            var duration:CMTime? = self?._player?.currentItem?.asset.duration
            
            let isLive: Bool = CMTIME_IS_INDEFINITE(duration ?? CMTime.indefinite)
            let progressFloat: Float = Float(CMTimeGetSeconds(progressTime))
            var durationFloat: Float = Float(CMTimeGetSeconds(duration ?? CMTime(value: 0, timescale: 1))) ?? progressFloat
            
            if(isLive){
                let liveData = self!.getLiveDuration()
                durationFloat = liveData.livePosition
            }
            
            // Update seekbar min max values
            self?.seekBar.minimumValue = 0
            self?.seekBar.maximumValue = durationFloat
            
            
            // Update UI when user is not dragging or seeking
            if(self!.isTracking == false && !self!.isSeeking){
                let isAnimated = isLive ? true : true
                self?.seekBar.setValue(progressFloat, animated: isAnimated)
                self!.updateCurrentTime(seconds: progressFloat)
                self!.updateDurationTime(seconds: durationFloat, isLive: isLive)
            }
        }
        
        // Register as an observer of the player item's status property
        self._playerItem?.addObserver(self,
           forKeyPath: #keyPath(AVPlayerItem.status),
           options: [.old, .new],
           context: &playerItemContext)
        
        self._player?.addObserver(
            self,
            forKeyPath: "timeControlStatus",
            options: [.old, .new],
            context: &playerItemContext)
        
        self._player?.addObserver(self, forKeyPath: "rate", options: [.old, .new], context: &playerItemContext)
            
    }
    
    override func observeValue(forKeyPath keyPath: String?,
                               of object: Any?,
                               change: [NSKeyValueChangeKey : Any]?,
                               context: UnsafeMutableRawPointer?) {

        // Only handle observations for the playerItemContext
        guard context == &playerItemContext else {
            super.observeValue(forKeyPath: keyPath,
                               of: object,
                               change: change,
                               context: context)
            return
        }
        
        forceUIRefresh()
        
        switch (keyPath) {
        case "timeControlStatus":
            let status = self._player?.timeControlStatus

            if status == .playing {
                setContentPlayStatus(playing: true)
            }else if status == .paused {
                setContentPlayStatus(playing: false)
            }
            break
            
        case "rate":
            if self._player!.rate > 0 {
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
                // Player item is not yet ready.
                print("unknown")
                break
            }
            break
        default:
            break
        }
    }
}
