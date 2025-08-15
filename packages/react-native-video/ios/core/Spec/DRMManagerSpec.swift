//
//  DRMManagerSpec.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 05/08/2025.
//

import Foundation
import AVFoundation

public protocol DRMManagerSpec: AVContentKeySessionDelegate {
  /// Creates a content key request for the given asset and DRM parameters.
  func createContentKeyRequest(for asset: AVURLAsset, drmParams: NativeDrmParams) throws
}
