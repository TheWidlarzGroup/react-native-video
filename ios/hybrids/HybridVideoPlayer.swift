//
//  HybridVideoPlayer.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 09/10/2024.
//

import Foundation
import NitroModules
import AVFoundation

class HybridVideoPlayer: HybridVideoPlayerSpec {
  var player: AVPlayer
  
  var source: any HybridVideoPlayerSourceSpec
  
  var volume: Double {
    set {
      player.volume = Float(newValue)
    }
    get {
      return Double(player.volume)
    }
  }
  
  var currentTime: Double {
    set {
      player.seek(
        to: CMTime(seconds: newValue, preferredTimescale: 1000),
        toleranceBefore: .zero,
        toleranceAfter: .zero
      )
    }
    get {
      player.currentTime().seconds
    }
  }
  
  init(source: HybridVideoPlayerSourceSpec) throws {
    self.source = source
    
    guard let url = URL(string: source.uri) else {
      throw RuntimeError.error(withMessage: "Invalid URL: \(source.uri)")
    }
    
    player = AVPlayer(url: url)
  }
  
  func play() throws {
    player.play()
  }
  
  func pause() throws {
    player.pause()
  }
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
