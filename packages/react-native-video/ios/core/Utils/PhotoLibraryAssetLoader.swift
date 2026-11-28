//
//  PhotoLibraryAssetLoader.swift
//  ReactNativeVideo
//

import AVFoundation
import Foundation
import Photos

protocol PhotoLibraryAssetLoading: Sendable {
  func loadAsset(for uri: String) async throws -> AVAsset
}

struct PhotoLibraryAssetRequest: Sendable {
  let cancel: @Sendable () -> Void
}

protocol PhotoLibraryAssetClient: Sendable {
  func requestAsset(
    forLocalIdentifier identifier: String,
    options: PHVideoRequestOptions,
    completion: @escaping @Sendable (Result<AVAsset, Error>) -> Void
  ) -> PhotoLibraryAssetRequest?
}

private struct SystemPhotoLibraryAssetClient: PhotoLibraryAssetClient {
  func requestAsset(
    forLocalIdentifier identifier: String,
    options: PHVideoRequestOptions,
    completion: @escaping @Sendable (Result<AVAsset, Error>) -> Void
  ) -> PhotoLibraryAssetRequest? {
    guard let photoAsset = PHAsset.fetchAssets(
      withLocalIdentifiers: [identifier],
      options: nil
    ).firstObject,
      photoAsset.mediaType == .video
    else {
      return nil
    }

    let imageManager = PHImageManager.default()
    let requestID = imageManager.requestAVAsset(
      forVideo: photoAsset,
      options: options
    ) { asset, _, info in
      if let isCancelled = info?[PHImageCancelledKey] as? NSNumber,
         isCancelled.boolValue {
        completion(.failure(CancellationError()))
      } else if let error = info?[PHImageErrorKey] as? Error {
        completion(.failure(error))
      } else if let asset {
        completion(.success(asset))
      } else {
        completion(.failure(SourceError.failedToInitializeAsset.error()))
      }
    }

    return PhotoLibraryAssetRequest {
      imageManager.cancelImageRequest(requestID)
    }
  }
}

private final class PhotoLibraryAssetLoadState: @unchecked Sendable {
  private enum Status {
    case pending
    case completed
    case cancelled
  }

  private let lock = NSLock()
  private var status: Status = .pending
  private var continuation: CheckedContinuation<AVAsset, Error>?
  private var request: PhotoLibraryAssetRequest?

  func installContinuation(_ continuation: CheckedContinuation<AVAsset, Error>) {
    let shouldCancel: Bool = withLock {
      switch status {
      case .pending:
        self.continuation = continuation
        return false
      case .cancelled:
        return true
      case .completed:
        return false
      }
    }

    if shouldCancel {
      continuation.resume(throwing: CancellationError())
    }
  }

  func installRequest(_ request: PhotoLibraryAssetRequest) {
    let shouldCancel: Bool = withLock {
      switch status {
      case .pending:
        self.request = request
        return false
      case .cancelled:
        return true
      case .completed:
        return false
      }
    }

    if shouldCancel {
      request.cancel()
    }
  }

  func complete(_ result: Result<AVAsset, Error>) {
    let continuation: CheckedContinuation<AVAsset, Error>? = withLock {
      guard case .pending = status else { return nil }
      status = .completed
      request = nil
      let continuation = self.continuation
      self.continuation = nil
      return continuation
    }

    continuation?.resume(with: result)
  }

  func cancel() {
    let cancellation: (
      continuation: CheckedContinuation<AVAsset, Error>?,
      request: PhotoLibraryAssetRequest?
    )? = withLock {
      guard case .pending = status else { return nil }
      status = .cancelled
      let cancellation = (continuation, request)
      continuation = nil
      request = nil
      return cancellation
    }

    cancellation?.request?.cancel()
    cancellation?.continuation?.resume(throwing: CancellationError())
  }

  @discardableResult
  private func withLock<T>(_ operation: () -> T) -> T {
    lock.lock()
    defer { lock.unlock() }
    return operation()
  }
}

final class PhotoLibraryAssetLoader: PhotoLibraryAssetLoading {
  private static let schemeDelimiter = "ph://"

  private let client: any PhotoLibraryAssetClient

  init() {
    client = SystemPhotoLibraryAssetClient()
  }

  init(client: any PhotoLibraryAssetClient) {
    self.client = client
  }

  func loadAsset(for uri: String) async throws -> AVAsset {
    guard uri.range(
      of: Self.schemeDelimiter,
      options: [.anchored, .caseInsensitive]
    ) != nil else {
      throw SourceError.invalidUri(uri: uri).error()
    }

    let identifier = String(uri.dropFirst(Self.schemeDelimiter.count))
    guard !identifier.isEmpty else {
      throw SourceError.invalidUri(uri: uri).error()
    }

    let options = PHVideoRequestOptions()
    options.isNetworkAccessAllowed = true
    let state = PhotoLibraryAssetLoadState()

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        state.installContinuation(continuation)
        guard !Task.isCancelled else {
          state.cancel()
          return
        }

        guard let request = client.requestAsset(
          forLocalIdentifier: identifier,
          options: options,
          completion: { result in
            state.complete(result)
          }
        ) else {
          state.complete(
            .failure(SourceError.photoLibraryAssetNotFound(uri: uri).error())
          )
          return
        }

        state.installRequest(request)
      }
    } onCancel: {
      state.cancel()
    }
  }
}
