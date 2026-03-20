//
//  HybridVideoPlayerSource.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/09/2024.
//

import AVFoundation
import Foundation
import NitroModules

class HybridVideoPlayerSource: HybridVideoPlayerSourceSpec, NativeVideoPlayerSourceSpec {
  var asset: AVURLAsset?
  var uri: String
  var config: NativeVideoConfig

  var drmManager: DRMManagerSpec?

  let url: URL
  private let sourceLoader = SourceLoader()

  init(config: NativeVideoConfig) throws {
    self.uri = config.uri
    self.config = config

    guard let url = URL(string: uri) else {
      throw SourceError.invalidUri(uri: uri).error()
    }

    self.url = url

    super.init()

    if config.drm != nil {
      // Try to get the DRM manager
      // If no DRM manager is found, it will throw an error
      _ = try PluginsRegistry.shared.getDrmManager(source: self)
    }
  }

  deinit {
    releaseAsset()
  }

  func getAssetInformationAsync() -> Promise<VideoInformation> {
    let promise = Promise<VideoInformation>()

    Task.detached(priority: .utility) { [weak self] in
      guard let self else {
        promise.reject(
          withError: LibraryError.deallocated(objectName: "HybridVideoPlayerSource").error())
        return
      }

      do {
        let videoInformation = try await self.sourceLoader.load(priority: .utility) {
          if self.url.isFileURL {
            try VideoFileHelper.validateReadPermission(for: self.url)
          }

          try await self.initializeAsset()

          guard let asset = self.asset else {
            throw PlayerError.assetNotInitialized.error()
          }

          return try await asset.getAssetInformation()
        }

        promise.resolve(withResult: videoInformation)
      } catch {
        if error is CancellationError {
          promise.reject(withError: SourceError.cancelled.error())
        } else {
          promise.reject(withError: error)
        }
      }
    }

    return promise
  }

  func initializeAsset() async throws {
    guard asset == nil else {
      return
    }

    if let headers = config.headers {
      let options = [
        "AVURLAssetHTTPHeaderFieldsKey": headers
      ]
      asset = AVURLAsset(url: url, options: options)
    } else {
      asset = AVURLAsset(url: url)
    }

    guard let asset else {
      throw SourceError.failedToInitializeAsset.error()
    }

    do {
      if let drmParams = config.drm {
        drmManager = try PluginsRegistry.shared.getDrmManager(source: self)

        guard let drmManager else {
          throw LibraryError.DRMPluginNotFound.error()
        }

        do {
          try drmManager.createContentKeyRequest(for: asset, drmParams: drmParams)
        } catch {
          print("[ReactNativeVideo] Failed to create content key request for DRM: \(drmParams)")
        }
      }

      // Code browned from expo-video https://github.com/expo/expo/blob/ea17c9b1ce5111e1454b089ba381f3feb93f33cc/packages/expo-video/ios/VideoPlayerItem.swift#L40C30-L40C73
      // If we don't load those properties, they will be loaded on main thread causing lags
      _ = try? await asset.load(.duration, .preferredTransform, .isPlayable) as Any

      try Task.checkCancellation()
    } catch {
      self.asset = nil
      if error is CancellationError {
        throw SourceError.cancelled.error()
      }
      throw error
    }
  }

  func getAsset() async throws -> AVURLAsset {
    if let asset {
      return asset
    }

    do {
      try await sourceLoader.load {
        try await self.initializeAsset()
      }

      guard let asset else {
        throw SourceError.failedToInitializeAsset.error()
      }

      return asset
    } catch {
      if error is CancellationError {
        self.asset = nil
        throw SourceError.cancelled.error()
      }
      throw error
    }
  }

  func releaseAsset() {
    sourceLoader.cancelSync()
    asset = nil
  }

  var memorySize: Int {
    var size = 0

    size += asset?.estimatedMemoryUsage ?? 0

    return size
  }
}
