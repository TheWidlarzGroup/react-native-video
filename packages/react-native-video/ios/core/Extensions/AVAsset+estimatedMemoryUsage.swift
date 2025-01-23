//
//  AVAsset+estimatedMemoryUsage.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/01/2025.
//

import AVFoundation

extension AVAsset {
  var estimatedMemoryUsage: Int {
    var size = 0
    
    // Get enabled video tracks
    let enabledVideoTrack = tracks(withMediaType: .video)
      .filter { $0.isEnabled }
    
    // Calculate memory usage for video tracks
    for track in enabledVideoTrack {
      let dimensions = track.naturalSize
      let pixelCount = Int(dimensions.width * dimensions.height)
      let frameSize = pixelCount * 4 // RGBA
      let frames = 30 * 15 // 30 FPS * 15 seconds of buffer
      
      size += frameSize * frames
    }
    
    // Get enabled audio tracks
    let enabledAudioTrack = tracks(withMediaType: .audio)
      .filter { $0.isEnabled }
    
    // Estimate memory usage for audio tracks
    for _ in enabledAudioTrack {
      let frameSize = 44100 * 2 * 2 // 44.1kHz * 2 channels * 2 seconds
      size += frameSize
    }
    
    return size
  }
}