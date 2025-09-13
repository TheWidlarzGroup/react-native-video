//
//  AVPlayerItem+setBufferConfig.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 13/09/2025.
//

import Foundation
import AVFoundation

extension AVPlayerItem {
  func setBufferConfig(config: BufferConfig) {
    if let forwardBufferDurationMs = config.preferredForwardBufferDurationMs {
      preferredForwardBufferDuration = TimeInterval(forwardBufferDurationMs / 1000.0)
    }
    
    if let peakBitRate = config.preferredPeakBitRate {
      preferredPeakBitRate = Double(peakBitRate)
    }
    
    if let maximumResolution = config.preferredMaximumResolution {
      preferredMaximumResolution = CGSize(width: maximumResolution.width, height: maximumResolution.height)
    }
    
    if let peakBitRateForExpensiveNetworks = config.preferredPeakBitRateForExpensiveNetworks {
      preferredPeakBitRateForExpensiveNetworks = Double(peakBitRateForExpensiveNetworks)
    }
    
    if let maximumResolutionForExpensiveNetworks = config.preferredMaximumResolutionForExpensiveNetworks {
      preferredMaximumResolutionForExpensiveNetworks = CGSize(width: maximumResolutionForExpensiveNetworks.width, height: maximumResolutionForExpensiveNetworks.height)
    }
    
    if let liveTargetOffsetMs = config.livePlayback?.targetOffsetMs {
      configuredTimeOffsetFromLive = CMTime(seconds: Double(liveTargetOffsetMs) / 1000.0, preferredTimescale: 1000)
    }
  }
}
