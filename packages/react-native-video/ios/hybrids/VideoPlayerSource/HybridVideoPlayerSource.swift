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
  private let assetLoadLock = NSLock()
  private var _asset: AVURLAsset?
  private var _drmManager: DRMManagerSpec?
  private var currentAssetLoadReservation: SourceLoader.LoadReservation?

  private enum AssetRequest {
    case existing(AVURLAsset)
    case load(SourceLoader.LoadReservation)
  }

  private struct InformationRequest {
    let reservation: SourceLoader.LoadReservation
    let asset: AVURLAsset?
  }

  private struct LoadedAssetInformation {
    let information: VideoInformation
    let asset: AVURLAsset
  }

  var asset: AVURLAsset? {
    get {
      assetLoadLock.lock()
      defer { assetLoadLock.unlock() }
      return _asset
    }
    set {
      setAssetFromPlugin(newValue)
    }
  }

  var drmManager: DRMManagerSpec? {
    get {
      assetLoadLock.lock()
      defer { assetLoadLock.unlock() }
      return _drmManager
    }
    set {
      assetLoadLock.lock()
      defer { assetLoadLock.unlock() }
      _drmManager = newValue
    }
  }

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
    let request = beginInformationRequest()

    Task.detached(priority: .utility) { [weak self] in
      guard let self else {
        promise.reject(
          withError: LibraryError.deallocated(objectName: "HybridVideoPlayerSource").error())
        return
      }

      do {
        let loadedInformation = try await self.sourceLoader.load(
          reservation: request.reservation,
          isCurrent: { self.ownsAssetLoad(request.reservation) },
          priority: .utility
        ) {
          try await self.loadAssetInformation(for: request)
        }
        try self.ensureInformationOwnership(
          request.reservation,
          asset: loadedInformation.asset
        )

        promise.resolve(withResult: loadedInformation.information)
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

  private func loadAssetInformation(
    for request: InformationRequest
  ) async throws -> LoadedAssetInformation {
    try ensureCurrentAssetLoad(request.reservation, isCurrent: { true })

    if url.isFileURL {
      try VideoFileHelper.validateReadPermission(for: url)
    }

    let asset: AVURLAsset
    if let existingAsset = request.asset {
      guard currentAsset() === existingAsset else {
        throw CancellationError()
      }
      asset = existingAsset
    } else {
      asset = try await loadAsset(
        for: request.reservation,
        isCurrent: { true }
      )
    }

    try ensureCurrentAssetLoad(request.reservation, isCurrent: { true })
    let videoInformation = try await asset.getAssetInformation()
    return LoadedAssetInformation(information: videoInformation, asset: asset)
  }

  func initializeAsset() async throws {
    _ = try await getAsset()
  }

  func getAsset() async throws -> AVURLAsset {
    try await getAsset(isCurrent: { true })
  }

  func getAsset(isCurrent: @escaping () -> Bool) async throws -> AVURLAsset {
    guard isCurrent() else {
      throw CancellationError()
    }

    return try await getAsset(for: beginAssetRequest(), isCurrent: isCurrent)
  }

  private func getAsset(
    for request: AssetRequest,
    isCurrent: @escaping () -> Bool
  ) async throws -> AVURLAsset {
    guard isCurrent() else {
      throw CancellationError()
    }

    switch request {
    case .existing(let asset):
      return asset
    case .load(let reservation):
      return try await initializeAsset(
        for: reservation,
        isCurrent: isCurrent
      )
    }
  }

  private func initializeAsset(
    for reservation: SourceLoader.LoadReservation,
    isCurrent: @escaping () -> Bool
  ) async throws -> AVURLAsset {
    do {
      let asset = try await sourceLoader.load(
        reservation: reservation,
        isCurrent: {
          isCurrent() && self.ownsAssetLoad(reservation)
        }
      ) {
        try await self.loadAsset(
          for: reservation,
          isCurrent: isCurrent
        )
      }

      guard isCurrent(), ownsAssetLoad(reservation),
        currentAsset() === asset
      else {
        clearAsset(for: reservation)
        throw CancellationError()
      }

      return asset
    } catch {
      clearAsset(for: reservation)
      if error is CancellationError {
        throw SourceError.cancelled.error()
      }
      throw error
    }
  }

  private func loadAsset(
    for reservation: SourceLoader.LoadReservation,
    isCurrent: @escaping () -> Bool
  ) async throws -> AVURLAsset {
    try ensureCurrentAssetLoad(reservation, isCurrent: isCurrent)

    let asset: AVURLAsset
    if let headers = config.headers {
      let options = [
        "AVURLAssetHTTPHeaderFieldsKey": headers
      ]
      asset = AVURLAsset(url: url, options: options)
    } else {
      asset = AVURLAsset(url: url)
    }

    do {
      let drmManager: DRMManagerSpec?
      if let drmParams = config.drm {
        let manager = try PluginsRegistry.shared.getDrmManager(source: self)

        guard let manager else {
          throw LibraryError.DRMPluginNotFound.error()
        }

        do {
          try manager.createContentKeyRequest(for: asset, drmParams: drmParams)
        } catch {
          print("[ReactNativeVideo] Failed to create content key request for DRM: \(drmParams)")
        }
        drmManager = manager
      } else {
        drmManager = nil
      }

      _ = try? await asset.load(.duration, .preferredTransform, .isPlayable) as Any

      try Task.checkCancellation()
      try ensureCurrentAssetLoad(reservation, isCurrent: isCurrent)
      return try installAsset(asset, drmManager: drmManager, for: reservation)
    } catch {
      clearAsset(for: reservation)
      if error is CancellationError {
        throw SourceError.cancelled.error()
      }
      throw error
    }
  }

  private func beginAssetRequest() -> AssetRequest {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    if let asset = _asset {
      return .existing(asset)
    }
    // All source loads take the asset lock before reserving their SourceLoader
    // token, so the token and ownership marker cannot be published out of order.
    let reservation = sourceLoader.reserveLoad()
    currentAssetLoadReservation = reservation
    return .load(reservation)
  }

  private func beginInformationRequest() -> InformationRequest {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    let reservation = sourceLoader.reserveLoad()
    currentAssetLoadReservation = reservation
    return InformationRequest(reservation: reservation, asset: _asset)
  }

  private func ownsAssetLoad(_ reservation: SourceLoader.LoadReservation) -> Bool {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    return currentAssetLoadReservation === reservation
  }

  private func ensureCurrentAssetLoad(
    _ reservation: SourceLoader.LoadReservation,
    isCurrent: () -> Bool
  ) throws {
    guard isCurrent(), ownsAssetLoad(reservation) else {
      throw CancellationError()
    }
  }

  private func ensureInformationOwnership(
    _ reservation: SourceLoader.LoadReservation,
    asset: AVURLAsset
  ) throws {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    guard currentAssetLoadReservation === reservation, _asset === asset else {
      throw CancellationError()
    }
  }

  private func installAsset(
    _ asset: AVURLAsset,
    drmManager: DRMManagerSpec?,
    for reservation: SourceLoader.LoadReservation
  ) throws -> AVURLAsset {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    guard currentAssetLoadReservation === reservation else {
      throw CancellationError()
    }
    _asset = asset
    _drmManager = drmManager
    return asset
  }

  private func clearAsset(for reservation: SourceLoader.LoadReservation) {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    guard currentAssetLoadReservation === reservation else {
      return
    }
    currentAssetLoadReservation = nil
    _asset = nil
    _drmManager = nil
  }

  private func currentAsset() -> AVURLAsset? {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    return _asset
  }

  func releaseAsset() {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    sourceLoader.requestCancellation()
    currentAssetLoadReservation = nil
    _asset = nil
    _drmManager = nil
  }

  private func setAssetFromPlugin(_ asset: AVURLAsset?) {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    sourceLoader.requestCancellation()
    currentAssetLoadReservation = nil
    _asset = asset
    _drmManager = nil
  }

  var memorySize: Int {
    assetLoadLock.lock()
    defer { assetLoadLock.unlock() }
    return _asset?.estimatedMemoryUsage ?? 0
  }
}
