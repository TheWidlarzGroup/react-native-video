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
  var uri: String
  var config: NativeVideoConfig

  let url: URL
  private let sourceLoader = SourceLoader()
  private let photoLibraryAssetLoader: any PhotoLibraryAssetLoading
  private var storedAsset: AVAsset?
  private var storedDrmManager: DRMManagerSpec?

  private struct PreparedAsset {
    let asset: AVAsset
    let drmManager: DRMManagerSpec?
  }

  private struct InformationRequest {
    let token: SourceLoader.Token
    let asset: AVAsset?
  }

  private struct AssetInformationResult {
    let preparedAsset: PreparedAsset
    let information: VideoInformation
  }

  var asset: AVAsset? {
    get { sourceLoader.withState { storedAsset } }
    set {
      let releasedAsset = sourceLoader.cancel {
        let releasedAsset = storedAsset
        storedAsset = newValue
        return releasedAsset
      }
      withExtendedLifetime(releasedAsset) {}
    }
  }

  var drmManager: DRMManagerSpec? {
    get { sourceLoader.withState { storedDrmManager } }
    set { sourceLoader.withState { storedDrmManager = newValue } }
  }

  init(
    config: NativeVideoConfig,
    photoLibraryAssetLoader: any PhotoLibraryAssetLoading = PhotoLibraryAssetLoader()
  ) throws {
    uri = config.uri
    self.config = config
    self.photoLibraryAssetLoader = photoLibraryAssetLoader

    guard let url = URL(string: uri) else {
      throw SourceError.invalidUri(uri: uri).error()
    }

    self.url = url

    super.init()

    if config.drm != nil {
      // Try to get the DRM manager. If none is registered, the plugin registry throws.
      _ = try PluginsRegistry.shared.getDrmManager(source: self)
    }
  }

  deinit {
    releaseAsset()
  }

  func getAssetInformationAsync() -> Promise<VideoInformation> {
    let promise = Promise<VideoInformation>()
    let request: InformationRequest

    do {
      var existingAsset: AVAsset?
      guard let token = try sourceLoader.begin(onBegin: {
        existingAsset = storedAsset
      }) else {
        throw CancellationError()
      }
      request = InformationRequest(token: token, asset: existingAsset)
    } catch {
      promise.reject(withError: SourceError.cancelled.error())
      return promise
    }

    Task.detached(priority: .utility) { [weak self] in
      guard let self else {
        promise.reject(
          withError: LibraryError.deallocated(objectName: "HybridVideoPlayerSource").error())
        return
      }

      do {
        let result = try await self.sourceLoader.load(
          token: request.token,
          priority: .utility
        ) {
          if self.url.isFileURL {
            try VideoFileHelper.validateReadPermission(for: self.url)
          }

          let prepared = try await self.prepareAsset(
            existing: request.asset,
            token: request.token,
            isCurrent: { true }
          )
          let information = try await prepared.asset.getAssetInformation()
          return AssetInformationResult(
            preparedAsset: prepared,
            information: information
          )
        }

        try self.sourceLoader.commit(request.token) {
          if let existingAsset = request.asset {
            guard self.storedAsset === existingAsset else {
              throw CancellationError()
            }
          } else {
            self.storedAsset = result.preparedAsset.asset
            self.storedDrmManager = result.preparedAsset.drmManager
          }
        }
        promise.resolve(withResult: result.information)
      } catch {
        self.sourceLoader.cancel(request.token) {}
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
    _ = try await getAsset()
  }

  func getAsset() async throws -> AVAsset {
    try await getAsset(isCurrent: { true })
  }

  func getAsset(isCurrent: @escaping () -> Bool) async throws -> AVAsset {
    guard isCurrent() else { throw CancellationError() }

    var existingAsset: AVAsset?
    let token = try sourceLoader.begin(if: {
      existingAsset = storedAsset
      return existingAsset == nil
    })

    if let existingAsset {
      guard isCurrent() else { throw CancellationError() }
      if config.drm != nil, !(existingAsset is AVURLAsset) {
        throw SourceError.unsupportedContentType(uri: uri).error()
      }
      return existingAsset
    }

    guard let token else { throw CancellationError() }

    do {
      let prepared = try await sourceLoader.load(
        token: token,
        isCurrent: isCurrent
      ) {
        try await self.prepareAsset(
          existing: nil,
          token: token,
          isCurrent: isCurrent
        )
      }

      return try sourceLoader.commit(token) {
        storedAsset = prepared.asset
        storedDrmManager = prepared.drmManager
        return prepared.asset
      }
    } catch {
      let releasedAsset = sourceLoader.cancel(token) {
        let releasedAsset = storedAsset
        storedAsset = nil
        return releasedAsset
      }
      withExtendedLifetime(releasedAsset) {}
      if error is CancellationError {
        throw SourceError.cancelled.error()
      }
      throw error
    }
  }

  private func prepareAsset(
    existing: AVAsset?,
    token: SourceLoader.Token,
    isCurrent: () -> Bool
  ) async throws -> PreparedAsset {
    guard sourceLoader.isCurrent(token), isCurrent() else {
      throw CancellationError()
    }

    if let existing {
      if config.drm != nil, !(existing is AVURLAsset) {
        throw SourceError.unsupportedContentType(uri: uri).error()
      }

      return PreparedAsset(
        asset: existing,
        drmManager: sourceLoader.withState { storedDrmManager }
      )
    }

    let asset: AVAsset
    if url.scheme?.lowercased() == "ph" {
      asset = try await photoLibraryAssetLoader.loadAsset(for: uri)
    } else if let headers = config.headers {
      asset = AVURLAsset(
        url: url,
        options: ["AVURLAssetHTTPHeaderFieldsKey": headers]
      )
    } else {
      asset = AVURLAsset(url: url)
    }

    let drmManager: DRMManagerSpec?
    if let drmParams = config.drm {
      guard let urlAsset = asset as? AVURLAsset else {
        throw SourceError.unsupportedContentType(uri: uri).error()
      }

      let manager = try PluginsRegistry.shared.getDrmManager(source: self)
      guard let manager else {
        throw LibraryError.DRMPluginNotFound.error()
      }

      do {
        try manager.createContentKeyRequest(for: urlAsset, drmParams: drmParams)
      } catch {
        print("[ReactNativeVideo] Failed to create content key request for DRM: \(drmParams)")
      }
      drmManager = manager
    } else {
      drmManager = nil
    }

    _ = try? await asset.load(.duration, .preferredTransform, .isPlayable) as Any
    try Task.checkCancellation()
    guard sourceLoader.isCurrent(token), isCurrent() else {
      throw CancellationError()
    }

    return PreparedAsset(asset: asset, drmManager: drmManager)
  }

  func releaseAsset() {
    let releasedAsset = sourceLoader.cancel {
      let releasedAsset = storedAsset
      storedAsset = nil
      return releasedAsset
    }
    withExtendedLifetime(releasedAsset) {}
  }

  var memorySize: Int {
    let asset = sourceLoader.withState { storedAsset }
    return asset?.estimatedMemoryUsage ?? 0
  }
}
