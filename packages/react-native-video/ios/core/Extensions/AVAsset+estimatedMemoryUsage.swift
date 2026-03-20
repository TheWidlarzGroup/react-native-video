//
//  AVAsset+estimatedMemoryUsage.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/01/2025.
//

import AVFoundation
import Foundation

extension AVAsset {
  var estimatedMemoryUsage: Int {
    if let urlAsset = self as? AVURLAsset, urlAsset.url.isFileURL {
      let resourceValues = try? urlAsset.url.resourceValues(forKeys: [.fileSizeKey])
      if let fileSize = resourceValues?.fileSize, fileSize > 0 {
        return fileSize
      }
    }

    var estimatedSize = 0

    let videoTracks = tracks(withMediaType: .video)
    let audioTracks = tracks(withMediaType: .audio)

    for track in videoTracks {
      let size = track.naturalSize
      let pixelCount = size.width * size.height
      let duration = CMTimeGetSeconds(track.timeRange.duration)

      if duration > 0 && !duration.isNaN && !duration.isInfinite {
        let bitrate = track.estimatedDataRate > 0 ? track.estimatedDataRate : 2_000_000
        estimatedSize += Int((bitrate * Float(duration)) / 8)
      } else {
        estimatedSize += Int(pixelCount * 4)
      }
    }

    for track in audioTracks {
      let duration = CMTimeGetSeconds(track.timeRange.duration)
      let bitrate = track.estimatedDataRate > 0 ? track.estimatedDataRate : 128_000

      if duration > 0 && !duration.isNaN && !duration.isInfinite {
        estimatedSize += Int((bitrate * Float(duration)) / 8)
      } else {
        estimatedSize += 1_000_000
      }
    }

    return estimatedSize > 0 ? estimatedSize : 0
  }
}
