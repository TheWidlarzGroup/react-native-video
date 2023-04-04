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
    private var _player: AVPlayer? = nil
    private var timeObserverToken: Any?
    private var _playerItem:AVPlayerItem?
    
    var isPlaying: Bool {
        return _player?.rate != 0 && _player?.error == nil
    }
    
    private var progressBar: UISlider = {
        let bar = UISlider()
        bar.minimumTrackTintColor = .red
        bar.maximumTrackTintColor = .white
        bar.value = 0.0
        bar.isContinuous = false
        bar.addTarget(self, action: #selector(handleSliderChange), for: .valueChanged)
//        self.progressBarHighlightedObserver = bar.observe(\UISlider.isTracking, options: [.old, .new]) { (_, change) in
//            if let newValue = change.newValue {
//                self.didChangeProgressBarDragging?(newValue, bar.value)
//            }
//        }
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
        return stackView
    }()
    
    var mainStack: UIStackView = {
        let stackView = UIStackView()
        stackView.axis  = .vertical
        stackView.alignment = .fill
        stackView.distribution = .fill
        stackView.layoutMargins = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.backgroundColor = UIColor.red.withAlphaComponent(0.2)
        
        return stackView
    }()
    
    var playButton: UIButton = {
        let button = UIButton()
        
        let bundle = Bundle(for: RCTPlaybackController.self)
        button.setImage(UIImage(named: "play-solid", in:bundle, with: nil), for: .normal)
        button.setImage(UIImage(named: "play-solid"), for: .selected)

        button.setTitle("Play", for: .normal)
        button.setTitle("Pause", for: .selected)
        
        button.translatesAutoresizingMaskIntoConstraints = false
        
        return button
    }()
    
    var curTimeLabel: UILabel = {
        let label = UILabel()
        label.text = "--:--"
        label.textColor = UIColor.white
        return label
    }()
    
    var durTimeLabel: UILabel = {
        let label = UILabel()
        label.text = "--:--"
        label.textColor = UIColor.white
        return label
    }()
    
    init(playerItem: AVPlayerItem!, player: AVPlayer?) {
        super.init(frame: .zero)
        self.clearPlayerListeners()
        self._playerItem = playerItem
        self._player = player

        playButton.addTarget(self, action: #selector(togglePaused), for: .touchUpInside)
        
        mainControlStack.addArrangedSubview(playButton)
        mainControlStack.addArrangedSubview(curTimeLabel)
        mainControlStack.addArrangedSubview(self.progressBar)
        mainControlStack.addArrangedSubview(durTimeLabel)
    
        let filler = UIView()
        mainStack.addArrangedSubview(filler)
        mainStack.addArrangedSubview(mainControlStack)
        self.addSubview(self.mainStack)
        self.addPlayerListeners()
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    @objc func handleSliderChange() {
        guard let duration = _player?.currentItem?.duration else { return }
        let value = Float64(progressBar.value)// * CMTimeGetSeconds(duration)
        let seekTime = CMTime(value: CMTimeValue(value), timescale: 1)
        _playerItem?.seek(to: seekTime )
        print("seeking to time(s): \(value)")
    }
    
    func secondsToHoursMinutesSeconds(_ seconds: Int) -> (Int, String, Int, String, Int, String) {
        let h = seconds / 3600
        let h1 = String(format: "%02d", h)
        let m = (seconds % 3600) / 60
        let m1 = String(format: "%02d", m)
        let s = (seconds % 3600) % 60
        let s1 = String(format: "%02d", s)
        
        
        
        String(format: "%02d", m)
        String(format: "%02d", s)
        
        return (h, h1, m, m1, s, s1)
    }
    
    @objc func updateUi(){
        playButton.isSelected = isPlaying
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
    func updateCurrentTime(seconds: Int){
        let (h, h1, m, m1, s, s1) = secondsToHoursMinutesSeconds(seconds)
        if(h>0){
            self.curTimeLabel.text = "\(h1):\(m1):\(s1)"
        }else{
            self.curTimeLabel.text = "\(m1):\(s1)"
        }
    }
    
    func updateDurationTime(seconds: Int){
        let (h, h1, m, m1, s, s1) = secondsToHoursMinutesSeconds(seconds)
        if(h>0){
            self.durTimeLabel.text = "\(h1):\(m1):\(s1)"
        }else{
            self.durTimeLabel.text = "\(m1):\(s1)"
        }
    }
    
    func addPlayerListeners(){
        timeObserverToken = _player?.addPeriodicTimeObserver(forInterval: CMTime(value: CMTimeValue(1), timescale: 2), queue: DispatchQueue.main) {[weak self] (progressTime) in
            //print("periodic time: \(CMTimeGetSeconds(progressTime))")
            //self?.updatePlaybackProgress(progressTime: progressTime)
            var duration:CMTime? = self?._player?.currentItem?.asset.duration
            
            let progressFloat: Float = Float(CMTimeGetSeconds(progressTime))
            let durationFloat: Float = Float(CMTimeGetSeconds(duration!)) ?? progressFloat
            
            self?.progressBar.minimumValue = 0
            self?.progressBar.maximumValue = durationFloat
            self?.progressBar.setValue(progressFloat, animated: true)
            //print(" ----- progressBar: \(progressFloat)/\(durationFloat)")

            self!.updateCurrentTime(seconds: Int(progressFloat.rounded()))
            self!.updateDurationTime(seconds: Int(durationFloat.rounded()))
        }
        
        // Register as an observer of the player item's status property
        _playerItem?.addObserver(self,
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
