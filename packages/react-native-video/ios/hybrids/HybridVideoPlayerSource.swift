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
  
  func getAssetInformationAsync() throws -> Promise<VideoInformation> {
    return Promise.async(.utility) { [weak self] in
      guard let self else {
        throw RuntimeError.error(withMessage: "HybridVideoPlayerSource has been deallocated")
      }
      
      if self.url.isFileURL {
        try checkReadFilePermission(for: self.url)
      }
      
      try initializeAsset()
      
      guard let asset = self.asset else {
        throw RuntimeError.error(withMessage: "Failed to initialize asset")
      }
      
      return try await AVAssetUtils.getAssetInformation(for: asset)
    }
  }
  
  public func initializeAsset() throws {
    guard asset == nil else {
      return
    }
    
    // TODO: Pass headers here
    asset = AVURLAsset(url: url)
  }
  
  private func checkReadFilePermission(for path: URL) throws {
    let fileManager = FileManager.default
    if !fileManager.isReadableFile(atPath: path.path) {
      throw RuntimeError.error(withMessage: "Cannot read file at path: \(path.path), is path \(path.path) correct? Does app have permission to read file?")
    }
  }
}
