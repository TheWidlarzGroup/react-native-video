//
//  HybridVideoPlayerSource.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import Foundation
import AVFoundation
import NitroModules

class HybridVideoPlayerSource: HybridVideoPlayerSourceSpec {
  public var asset: AVURLAsset?
  var uri: String
  
  let url: URL
  
  init(uri: String) throws {
    self.uri = uri
    
    guard let url = URL(string: uri) else {
      throw RuntimeError.error(withMessage: "Invalid URL: \(uri)")
    }
    
    self.url = url
  }
  
  deinit {
    releaseAsset()
  }
  
  func getAssetInformationAsync() throws -> Promise<VideoInformation> {
    return Promise.async(.utility) { [weak self] in
      guard let self else {
        throw RuntimeError.error(withMessage: "HybridVideoPlayerSource has been deallocated")
      }
      
      if self.url.isFileURL {
        try VideoFileHelper.validateReadPermission(for: self.url)
      }
      
      try initializeAsset()
      
      guard let asset = self.asset else {
        throw RuntimeError.error(withMessage: "Failed to initialize asset")
      }
      
      return try await asset.getAssetInformation()
    }
  }
  
  public func initializeAsset() throws {
    guard asset == nil else {
      return
    }
    
    // TODO: Pass headers here
    asset = AVURLAsset(url: url)
  }
  
  public func releaseAsset() {
    asset = nil
  }
  
  override var memorySize: Int {
    var size = 0
    
    size += asset?.estimatedMemoryUsage ?? 0
    
    return size
  }
}
