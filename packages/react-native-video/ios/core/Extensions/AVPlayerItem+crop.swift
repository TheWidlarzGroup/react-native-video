//
//  AVPlayerItem+crop.swift
//  ReactNativeVideo
//

import AVFoundation
import Foundation

// `cropStart` / `cropEnd` limit playback to a part of the item. The limits are kept on the
// item itself (`reversePlaybackEndTime` / `forwardPlaybackEndTime`), and the player reports
// time relative to that part, so the part behaves like the whole video.
extension AVPlayerItem {

  /// Applies `cropStart` and `cropEnd` (milliseconds). Values that make no range are ignored.
  func setCrop(start cropStart: Double?, end cropEnd: Double?) {
    // NaN and Infinity count as not set, as on Android
    let startMs = cropStart.flatMap { $0.isFinite ? max(0, $0) : nil } ?? 0

    if startMs > 0 {
      reversePlaybackEndTime = CMTime(seconds: startMs / 1000, preferredTimescale: 1000)
    }

    if let cropEnd, cropEnd.isFinite, cropEnd > startMs {
      forwardPlaybackEndTime = CMTime(seconds: cropEnd / 1000, preferredTimescale: 1000)
    }
  }

  /// Where the playable part starts, in seconds of the item's own timeline. 0 when not cropped.
  var cropStartSeconds: Double {
    let start = reversePlaybackEndTime
    return start.isNumeric ? start.seconds : 0
  }

  /// Current time counted from the start of the playable part.
  var croppedCurrentTime: Double {
    return max(0, currentTime().seconds - cropStartSeconds)
  }

  /// Length of the playable part. NaN while the duration is unknown and for live streams.
  var croppedDuration: Double {
    let total = duration.seconds
    let end = forwardPlaybackEndTime

    if end.isNumeric {
      // `cropEnd` past the end of the video plays to the end of the video
      let endSeconds = total.isFinite ? min(end.seconds, total) : end.seconds
      return max(0, endSeconds - cropStartSeconds)
    }

    return total.isFinite ? max(0, total - cropStartSeconds) : total
  }
}
