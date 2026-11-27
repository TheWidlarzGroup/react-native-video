//
//  AVPlayerItem+getBufferedPosition.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 06/05/2025.
//

import Foundation
import AVFoundation

extension AVPlayerItem {
  
  // Seconds buffered ahead of the current position
  func getbufferDuration() -> Double {
    let position = currentTime()
    var effectiveTimeRange: CMTimeRange?
    
    for value in loadedTimeRanges {
      let timeRange: CMTimeRange = value.timeRangeValue
      if CMTimeRangeContainsTime(timeRange, time: position) {
        effectiveTimeRange = timeRange
        break
      }
    }
    
    if let effectiveTimeRange {
      let bufferedAhead: Float64 = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange)) - CMTimeGetSeconds(position)
      if bufferedAhead > 0 {
        return bufferedAhead
      }
    }
    
    return 0
  }
}
