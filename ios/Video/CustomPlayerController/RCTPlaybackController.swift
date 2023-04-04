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
        
    
        // Listeners
        bar.addTarget(self, action: #selector(onSeekbarChange(slider:event:)), for: .valueChanged)
        return bar
    }()
    
    override func layoutSubviews(){
        super.layoutSubviews()
        
        // also adjust all subviews of contentOverlayView
        for subview in subviews ?? [] {
            subview.frame = bounds
            subview.backgroundColor = UIColor.red.withAlphaComponent(0.2)
        }
        
        NSLayoutConstraint.activate([
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 0),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: 0),
            mainStack.topAnchor.constraint(equalTo: topAnchor, constant: 0),
            mainStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: 0),
        ])
    }
    
    var mainControlStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.backgroundColor = UIColor.black.withAlphaComponent(0.4)
        stackView.spacing = 10
        stackView.isLayoutMarginsRelativeArrangement = true
        stackView.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10)
        return stackView
    }()
    
    var mainStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis  = .vertical
        stackView.alignment = .fill
        stackView.distribution = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.backgroundColor = UIColor.red.withAlphaComponent(0.2)
        return stackView
    }()
    
    var playButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(systemName: "play.fill"), for: .normal)
        button.setImage(UIImage(systemName: "pause.fill"), for: .selected)
        button.tintColor = .white
        
        // Width constraint
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 15))
        return button
    }()
    
    var fullscreenButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(systemName: "plus.square.fill"), for: .normal)
        button.setImage(UIImage(systemName: "minus.square.fill"), for: .selected)
        button.tintColor = .white
        
        // Width constraint
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addConstraint(NSLayoutConstraint(item: button, attribute: .width, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1, constant: 15))
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
    
    init(video: RCTVideo) {
        self._video = video
        super.init(frame: .zero)
        self.clearPlayerListeners()
    
        playButton.addTarget(self, action: #selector(togglePaused), for: .touchUpInside)
        
        fullscreenButton.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
        
        mainControlStack.addArrangedSubview(playButton)
        mainControlStack.addArrangedSubview(curTimeLabel)
        mainControlStack.addArrangedSubview(self.seekBar)
        mainControlStack.addArrangedSubview(durTimeLabel)
        mainControlStack.addArrangedSubview(fullscreenButton)
    
        let filler = UIView()
        mainStack.addArrangedSubview(filler)
        mainStack.addArrangedSubview(mainControlStack)
        
        self.addSubview(self.mainStack)
        self.addPlayerListeners()
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
                    break

                case .moved:
                    // handle drag moved
                    self.updateCurrentTime(seconds: slider.value)
                    break

                case .ended:
                    // End slider interaction
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
        let secondsInt = Int(seconds)
        var outputString = ""
        
        if(seconds > 3600){
            let h1 = numToString(myInt: secondsInt / 3600)
            outputString = "\(h1):"
        }
        
        let m1 = numToString(myInt: (secondsInt % 3600) / 60)
        let s1 = numToString(myInt: (secondsInt % 3600) % 60)
        outputString.append("\(m1):\(s1)")
        
        return outputString
    }
    
    @objc func updateUi(){
        playButton.isSelected = isPlaying
        fullscreenButton.isSelected = isFullscreen
    }
    
    @objc func togglePaused(){
        guard let _player = _player else { return }
        if(isPlaying){
            _player.pause()
        }else{
            _player.play()
        }
        updateUi()
    }
    
    @objc func toggleFullscreen(){
        if(isFullscreen){
            _video?.setFullscreen(false)
        }else{
            _video?.setFullscreen(true)
        }
        updateUi()
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
    
    func updateDurationTime(seconds: Float){
        self.durTimeLabel.text = secondsToTimeLabel(seconds)
    }
    
    func addPlayerListeners(){
        timeObserverToken = _player?.addPeriodicTimeObserver(forInterval: CMTime(value: CMTimeValue(1), timescale: 2), queue: DispatchQueue.main) {[weak self] (progressTime) in
            //print("periodic time: \(CMTimeGetSeconds(progressTime))")
            //self?.updatePlaybackProgress(progressTime: progressTime)
            var duration:CMTime? = self?._player?.currentItem?.asset.duration
            
            let progressFloat: Float = Float(CMTimeGetSeconds(progressTime))
            let durationFloat: Float = Float(CMTimeGetSeconds(duration ?? CMTime(value: 0, timescale: 1))) ?? progressFloat
            
            self?.seekBar.minimumValue = 0
            self?.seekBar.maximumValue = durationFloat
            

            if(self!.isTracking == false && !self!.isSeeking){
                self?.seekBar.setValue(progressFloat, animated: true)
                self!.updateCurrentTime(seconds: progressFloat)
                self!.updateDurationTime(seconds: durationFloat)
            }
        }
        
        // Register as an observer of the player item's status property
        self._playerItem?.addObserver(self,
           forKeyPath: #keyPath(AVPlayerItem.status),
           options: [.old, .new],
           context: &playerItemContext)
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
        
        updateUi()

        if keyPath == #keyPath(AVPlayerItem.status) {
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
        }
    }
}
