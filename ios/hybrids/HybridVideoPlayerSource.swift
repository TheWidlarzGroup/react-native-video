//
//  HybridVideoPlayerSource.swift
//  NitroVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import AVFoundation

class HybridVideoPlayerSource: HybridVideoPlayerSourceSpec {
  var uri: String {
    didSet {
      guard let url = URL(string: uri) else {
        return
      }
      playerItem = AVPlayerItem(url: url)
    }
  }
  var playerItem: AVPlayerItem?
  
  init(uri: String) {
    self.uri = uri
  }
  
  // Initialize HybridContext
  var hybridContext = margelo.nitro.HybridContext()
  
  // Return size of the instance to inform JS GC about memory pressure
  var memorySize: Int {
    return getSizeOf(self)
  }
}
