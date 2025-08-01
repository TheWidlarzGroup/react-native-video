//
//  VideoFileHelper.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 24/01/2025.
//

import Foundation
import NitroModules

// MARK: - LibraryError
enum LibraryError: VideoError {
  case deallocated(objectName: String)
  case DRMPluginNotFound

  var code: String {
    switch self {
    case .deallocated:
      return "library/deallocated"
    case .DRMPluginNotFound:
      return "library/drm-plugin-not-found"
    }
  }

  var message: String {
    switch self {
    case let .deallocated(objectName: objectName):
      return "Object \(objectName) has been deallocated"
    case .DRMPluginNotFound:
      return "No DRM plugin have been found, please add one to the project"
    }
  }
}

// MARK: - PlayerError
enum PlayerError: VideoError {
  case notInitialized
  case assetNotInitialized
  case invalidSource
  case invalidTrackUrl(url: String)
  
  var code: String {
    switch self {
    case .notInitialized:
      return "player/not-initialized"
    case .assetNotInitialized:
      return "player/asset-not-initialized"
    case .invalidSource:
      return "player/invalid-source"
    case .invalidTrackUrl:
      return "player/invalid-track-url"
    }
  }
  
  var message: String {
    switch self {
    case .notInitialized:
      return "Player has not been initialized (Or has been set to nil)"
    case .assetNotInitialized:
      return "Asset has not been initialized (Or has been set to nil)"
    case .invalidSource:
      return "Invalid source passed to player"
    case let .invalidTrackUrl(url: url):
      return "Invalid track URL: \(url)"
    }
  }
}

// MARK: - SourceError
enum SourceError: VideoError {
  case invalidUri(uri: String)
  case missingReadFilePermission(uri: String)
  case fileDoesNotExist(uri: String)
  case failedToInitializeAsset
  case unsupportedContentType(uri: String)

  var code: String {
    switch self {
    case .invalidUri:
      return "source/invalid-uri"
    case .missingReadFilePermission:
      return "source/missing-read-file-permission"
    case .fileDoesNotExist:
      return "source/file-does-not-exist"
    case .failedToInitializeAsset:
      return "source/failed-to-initialize-asset"
    case .unsupportedContentType:
      return "source/unsupported-content-type"
    }
  }

  var message: String {
    switch self {
    case let .invalidUri(uri: uri):
      return "Invalid source file uri: \(uri)"
    case let .missingReadFilePermission(uri: uri):
      return "Missing read file permission for source file at \(uri)"
    case let .fileDoesNotExist(uri: uri):
      return "File does not exist at URI: \(uri)"
    case .failedToInitializeAsset:
      return "Failed to initialize asset"
    case let .unsupportedContentType(uri: uri):
      return "type of content (\(uri)) is not supported"
    }
  }
}

// MARK: - VideoViewError
enum VideoViewError: VideoError {
  case viewNotFound(nitroId: Double)
  case viewIsDeallocated
  case pictureInPictureNotSupported
  
  var code: String {
    switch self {
    case .viewNotFound:
      return "view/not-found"
    case .viewIsDeallocated:
      return "view/deallocated"
    case .pictureInPictureNotSupported:
      return "view/picture-in-picture-not-supported"
    }
  }
  
  var message: String {
    switch self {
    case let .viewNotFound(nitroId: nitroId):
      return "View with nitroId \(nitroId) not found"
    case .viewIsDeallocated:
      return "Attempt to access a view, but it has been deallocated (or not initialized)"
    case .pictureInPictureNotSupported:
      return "Picture in picture is not supported on this device"
    }
  }
}

// MARK: - UnknownError
struct UnknownError: VideoError {
  var code: String { "unknown/unknown" }
  var message: String { "Unknown error" }
}

// MARK: - VideoError
protocol VideoError {
  var code: String { get }
  var message: String { get }
}

extension VideoError {
  private func getMessage() -> String {
    return "{%@\(code)::\(message)@%}"
  }

  func error() -> Error {
    return RuntimeError.error(withMessage: getMessage())
  }
}


