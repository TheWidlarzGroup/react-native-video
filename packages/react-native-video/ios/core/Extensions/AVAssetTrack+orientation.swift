//
//  AVAssetTrack+orientation.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/01/2025.
//

import AVFoundation

extension AVAssetTrack {
  var orientation: VideoOrientation {
    let transform = preferredTransform
    let size = naturalSize.applying(transform)
    
    // Check if video is square
    if size.width == size.height {
      return .square
    }
    
    // Check if video is portrait or landscape
    let isNaturalSizePortrait = size.width < size.height
    
    // Calculate video rotation
    let angle = atan2(Double(transform.b), Double(transform.a))
    let degrees = angle * 180 / .pi
    let rotation = degrees < 0 ? degrees + 360 : degrees
    
    switch rotation {
    case 0:
      return isNaturalSizePortrait ? .portrait : .landscapeRight
    case 90, -270:
      return .portrait
    case 180, -180:
      return isNaturalSizePortrait ? .portraitUpsideDown : .landscapeLeft
    case 270, -90:
      return .portraitUpsideDown
    default:
      return isNaturalSizePortrait ? .portrait : .landscape
    }
  }
}