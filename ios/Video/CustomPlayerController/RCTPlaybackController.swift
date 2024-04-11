import Foundation
import AVFoundation
import AVKit
import MediaPlayer

//MARK: Extensions
extension UIColor {
    static let lighterGray = UIColor(red: 1.00, green: 1.00, blue: 0.99, alpha: 1.00)
}

extension Bundle {
    func image(named imageName: String, withTintColor tintColor: UIColor?) -> UIImage? {
        var image = UIImage(named: imageName, in: self, compatibleWith: nil)
        if let tintColor = tintColor {
            image = image?.withTintColor(tintColor)
        }
        return image
    }
}

extension UIImage {
    static func ellipsis(height: Double, width: Double, color: UIColor) -> UIImage? {
      let size = CGSize(width: width, height: height)
      UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
      let context = UIGraphicsGetCurrentContext()
      context?.setFillColor(color.cgColor)
      context?.setStrokeColor(UIColor.clear.cgColor)
      let bounds = CGRect(origin: .zero, size: size)
      context?.addEllipse(in: bounds)
      context?.drawPath(using: .fill)
      let image = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      return image
  }
}

extension UILabel {
    convenience init(withFontSize fontSize: CGFloat) {
        self.init()
        self.font = UIFont.systemFont(ofSize: fontSize)
    }
}

// HELPER CONSTANTS
let TIME_LABEL_SIZE_MINUTES: CGFloat = 44
let TIME_LABEL_SIZE_HOURS: CGFloat = 56
let TIME_LABEL_SIZE_LIVE_OFFSET: CGFloat = 6
let ICON_SIZE: CGFloat = 20

@objc class UISliderDummy: UIControl {
    enum TargetType {
        case valueChanged
    }

    var isContinuous = true

    var value: Float = 0.0
    var minimumValue: Float = 0.0
    var maximumValue: Float = 0.0

    var minimumTrackTintColor: UIColor = .lighterGray
    var maximumTrackTintColor: UIColor = .darkGray
    var thumbTintColor: UIColor = .lighterGray

    func addTarget(_ target: Any, action: Selector, for: TargetType) {}
    func setValue(_ value: Float, animated: Bool) {}
    func setThumbImage(_ image: UIImage?, for: UIControl.State) {}
}

//MARK: Class variables
class RCTPlaybackController: UIView, AVRoutePickerViewDelegate {
    private var _isAdDisplaying = false // Advertisements play status
    private var _isAdPlaying = true
    private var _isContentPlaying = false // Content play status
    private var _isLive = false
    private var _isSeeking = false
    private var _isTracking = false // Is dragging seekbar
    private var _isVisible = false
    private var _playerItemContext = 0
    private var _timeObserverToken: Any?
    private var _video: RCTVideo?
    private var _visibilityTimer: Timer?
    private var _duration: Float = 0

    // UI Stacks
    private var bottomControlStack = UIStackView()
    private var centerControlStack = UIView()
    private var mainStack = UIStackView()
    private var topControlStack = UIStackView()
    
    // UI Elements
    private var curTimeLabel = UILabel(withFontSize: 13)
    private var curTimeWidthConstraint: NSLayoutConstraint?
    private var durTimeLabel = UILabel(withFontSize: 13)
    private var durTimeWidthConstraint: NSLayoutConstraint?
    private var fullscreenButtonTop = UIButton()
    private var gradienceLayer = CAGradientLayer()
    private var playButton = UIButton()
    
    // Misc
    private var iconBundle: Bundle?

    // Platform dependent UI components
    #if os(iOS)
    private var seekBar = UISlider()
    #else
    private var seekBar = UISliderDummy()
    #endif

    
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
        curTimeLabel.lineBreakMode = .byClipping
        curTimeWidthConstraint = NSLayoutConstraint(item: curTimeLabel, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: TIME_LABEL_SIZE_MINUTES)
        curTimeLabel.addConstraint(curTimeWidthConstraint!)
    }
    
    func initDurTimeLabel(){
        durTimeLabel.text = "--:--"
        durTimeLabel.textColor = UIColor.white
        durTimeLabel.translatesAutoresizingMaskIntoConstraints = false
        durTimeLabel.lineBreakMode = .byClipping
        durTimeWidthConstraint = NSLayoutConstraint(item: durTimeLabel, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: TIME_LABEL_SIZE_MINUTES)
        durTimeLabel.addConstraint(durTimeWidthConstraint!)
    }
    
    func initFullscreenButtonTop(){
        fullscreenButtonTop.setImage(iconBundle?.image(named: "fullscreen", withTintColor: .white), for: .normal)
        fullscreenButtonTop.setImage(iconBundle?.image(named: "fullscreen_exit", withTintColor: .white), for: .selected)
        fullscreenButtonTop.imageView?.contentMode = .scaleAspectFit
        fullscreenButtonTop.tintColor = .white
        
        // Size configuration
        fullscreenButtonTop.translatesAutoresizingMaskIntoConstraints = false
        fullscreenButtonTop.widthAnchor.constraint(equalToConstant: ICON_SIZE).isActive = true
        fullscreenButtonTop.heightAnchor.constraint(equalToConstant: ICON_SIZE).isActive = true
        
        // Add button press callback
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
        
        // Size configuration
        playButton.translatesAutoresizingMaskIntoConstraints = false
        playButton.widthAnchor.constraint(equalToConstant: ICON_SIZE).isActive = true
        playButton.heightAnchor.constraint(equalToConstant: ICON_SIZE).isActive = true
        playButton.imageView?.contentMode = .scaleAspectFit
        
        playButton.setImage(iconBundle?.image(named: "play", withTintColor: .white), for: .normal)
        playButton.setImage(iconBundle?.image(named: "pause", withTintColor: .white), for: .selected)
        
        playButton.addTarget(self, action: #selector(togglePaused), for: .touchUpInside)
    }
    
    func initPlayerListeners(){
        _timeObserverToken = _player?.addPeriodicTimeObserver(forInterval: CMTime(value: CMTimeValue(1), timescale: 2), queue: .main) {[weak self] (progressTime) in
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
        
        // Resize seekbar thumb when dragged
        seekBar.setThumbImage(.ellipsis(height: 10, width: 10, color: .lighterGray), for: .normal)
        seekBar.setThumbImage(.ellipsis(height: 15, width: 15, color: .lighterGray), for: .highlighted)
        
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
        self.updateTimeLabelSize(isHours: false)
        self.initPlayButton()
        self.initFullscreenButtonTop()
        
        // Initialize listeners and delegates
        self.clearPlayerListeners()
        self.initPlayerListeners()

        // Display playback controls
        self.showControls()
    }
    
    //MARK: Override/delegate/callback functions
    override func layoutSubviews(){
        super.layoutSubviews()
        
        // also adjust all subviews of contentOverlayView
        for subview in subviews {
            subview.frame = bounds
        }
        
        for _ in mainStack.layer.sublayers ?? []{
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
    
    func onDurationChange(duration: Float){
        _duration = duration
        self.setUi_durationTime(seconds: duration)
    }
    
    func onProgress(progressTime: CMTime){
        var assetDuration:CMTime? = self._player?.currentItem?.asset.duration
        
        self.updateLiveState(duration: assetDuration ?? CMTime.indefinite)
        
        var progress = Float(CMTimeGetSeconds(progressTime))
        var duration = Float(CMTimeGetSeconds(assetDuration ?? CMTime(value: 0, timescale: 1))) ?? progress
        
        var secondsFromSeekStart : Float = 0.0
        var startPosition: Float = 0.0
        
        // Is this a live stream?
        if(_isLive){
            let liveData = self.getLiveDuration()
            duration = liveData.livePosition
            secondsFromSeekStart = liveData.secondsBehindLive
            startPosition = liveData.seekableStart
        }
        
        // Configure the seek bar
        self.seekBar.minimumValue = startPosition
        self.seekBar.maximumValue = duration
        
        // Update UI when user is not dragging or seeking
        if(self._isTracking == false && self._isSeeking == false){
            self.seekBar.setValue(progress, animated: !_isLive)
            self.setUi_currentTime(seconds: _isLive ? secondsFromSeekStart : progress)
            
            // Check if duration changed
            if (abs(duration - _duration) > .ulpOfOne) {
                onDurationChange(duration: duration)
            }
        }
    }
    
    #if os(tvOS)
    @objc func onSeekbarChange(slider: UISliderDummy, event: UIEvent) {}
    #else
    @objc func onSeekbarChange(slider: UISlider, event: UIEvent) {
        if let touchEvent = event.allTouches?.first {
                switch touchEvent.phase {
                case .began:
                    // Start slider interaction
                    curTimeLabel.alpha = 0.8
                    self._isTracking = true
                    invalidateVisibilityTimer()
                    break

                case .moved:
                    // handle drag moved
                    if(_isLive){
                        let liveData = getLiveDuration()
                        let secondsBehindLive = liveData.secondsBehindLive
                        //let seekTime = slider.value - secondsBehindLive
                        let seekTime = min(-(liveData.seekableEnd - slider.value), -0.0)
                        self.setUi_currentTime(seconds: seekTime)
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
    #endif
    
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
                secondsBehindLive = min(currentTime - seekableDuration - seekableStart, -0.0)
                
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
    
    func updateLiveState(duration: CMTime?){
        var duration: CMTime? = duration ?? _player?.currentItem?.duration
        _isLive = CMTIME_IS_INDEFINITE(duration ?? CMTime.indefinite)
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
        guard !seconds.isNaN else {return "--:--"}
        
        var secondsInt = Int(seconds)
        var outputString = ""
        
        // Handle negative values (and negative zero)
        if(seconds.sign == .minus){
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
    
    func updateTimeLabelSize(isHours: Bool){
        let width = isHours ? TIME_LABEL_SIZE_HOURS: TIME_LABEL_SIZE_MINUTES
        let liveOffset = _isLive ? TIME_LABEL_SIZE_LIVE_OFFSET : 0

        // Set time label width
        curTimeWidthConstraint?.constant = width + liveOffset
        durTimeWidthConstraint?.constant = width
        
        // Autosize duration label if its displaying a static text value
        durTimeWidthConstraint?.isActive = !_isLive
        
        // Trigger layout update
        bottomControlStack.layoutIfNeeded()
    }
    
    func setUi_durationTime(seconds: Float){
        self.durTimeLabel.text = _isLive ? "Live": secondsToTimeLabel(seconds)
        
        // Resize time labels based on HH:MM:SS and MM:SS
        let durationInHours = seconds / 3600
        updateTimeLabelSize(isHours: durationInHours >= 1)
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
