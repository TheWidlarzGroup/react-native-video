//
//  AVPlayerItem+getBufferedPosition.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 06/05/2025.
//

import Foundation
import AVFoundation

extension AVPlayerItem {
  
  // Duration that can be played using only the buffer (seconds)
  func getbufferDuration() -> Double {
    var effectiveTimeRange: CMTimeRange?
    
    for value in loadedTimeRanges {
      let timeRange: CMTimeRange = value.timeRangeValue
      if CMTimeRangeContainsTime(timeRange, time: currentTime()) {
        effectiveTimeRange = timeRange
        break
      }
    }
    
    if let effectiveTimeRange {
      let playableDuration: Float64 = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange))
      if playableDuration > 0 {
        return playableDuration
      }
    }
    
    return 0
  }
}
