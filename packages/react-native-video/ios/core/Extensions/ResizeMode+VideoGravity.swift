//
//  ResizeMode.swift
//  ReactNativeVideo
//
//  Created for resizeMode feature
//

import Foundation
import AVFoundation

public extension ResizeMode {
  func toVideoGravity() -> AVLayerVideoGravity {
    switch self {
      case .contain:
        return .resizeAspect
      case .cover:
        return .resizeAspectFill
      case .stretch:
        return .resize
      case .none:
        return .resizeAspect // Default to aspect ratio if none specified
    }
  }
}
