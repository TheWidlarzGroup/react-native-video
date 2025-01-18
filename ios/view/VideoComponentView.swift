//
//  VideoComponent.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 30/09/2024.
//

import Foundation
import UIKit
import AVFoundation

@objc public class VideoComponentView: UIView {
  public var player: HybridVideoPlayerSpec? = nil {
    didSet {
      guard let player = player as? HybridVideoPlayer else { return }
      configureAVPlayerLayer(with: player.playerPointer)
    }
  }
  private var playerView: UIView? = nil
  private var avPlayerLayer: AVPlayerLayer?
  
  @objc public var nitroId: NSNumber = -1 {
    didSet {
      VideoComponentView.globalViewsMap.setObject(self, forKey: nitroId)
    }
  }
  
  @objc public static var globalViewsMap: NSMapTable<NSNumber, VideoComponentView> = .strongToWeakObjects()
  
  @objc public override init(frame: CGRect) {
    super.init(frame: frame)
    setupPlayerView()
  }
  
  @objc public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupPlayerView()
  }
  
  func setNitroId(nitroId: NSNumber) -> Void {
    self.nitroId = nitroId
  }
  
  private func setupPlayerView() {
    // Create a UIView to hold the video player layer
    playerView = UIView(frame: self.bounds)
    playerView?.translatesAutoresizingMaskIntoConstraints = false
    if let playerView = playerView {
      addSubview(playerView)
      NSLayoutConstraint.activate([
        playerView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
        playerView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
        playerView.topAnchor.constraint(equalTo: self.topAnchor),
        playerView.bottomAnchor.constraint(equalTo: self.bottomAnchor)
      ])
    }
  }
  
  public func configureAVPlayerLayer(with player: AVPlayer) {
    DispatchQueue.main.async { [weak self] in
      self?.avPlayerLayer = AVPlayerLayer(player: player)
      
      if let avPlayerLayer = self?.avPlayerLayer, let playerView = self?.playerView {
        avPlayerLayer.frame = playerView.bounds
        avPlayerLayer.videoGravity = .resizeAspect
        playerView.layer.addSublayer(avPlayerLayer)
      }
    }
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    // Update the frame of the player layer when the view's layout changes
    avPlayerLayer?.frame = playerView?.bounds ?? .zero
  }
}
