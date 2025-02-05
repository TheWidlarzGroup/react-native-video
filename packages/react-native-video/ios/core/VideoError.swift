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

  var code: String {
    switch self {
    case .deallocated:
      return "library/deallocated"
    }
  }

  var message: String {
    switch self {
    case let .deallocated(objectName: objectName):
      return "Object \(objectName) has been deallocated"
    }
  }
}

// MARK: - PlayerError
enum PlayerError: VideoError {
  case notIntilaized
  case assetNotInitialized
  case invalidSource
  
  var code: String {
    switch self {
    case .notIntilaized:
      return "player/not-initialized"
    case .assetNotInitialized:
      return "player/asset-not-initialized"
    case .invalidSource:
      return "player/invalid-source"
    }
  }
  
  var message: String {
    switch self {
    case .notIntilaized:
      return "Player has not been initialized (Or has been set to nil)"
    case .assetNotInitialized:
      return "Asset has not been initialized (Or has been set to nil)"
    case.invalidSource:
      return "Invalid source passed to player"
    }
  }
}

// MARK: - SourceError
enum SourceError: VideoError {
  case invalidUri(uri: String)
  case missingReadFilePermission(uri: String)
  case fileDoesNotExist(uri: String)
  case failedToInitializeAsset

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
    }
  }

  var message: String {
    switch self {
    case let .invalidUri(uri: uri):
      return "Invalid source file uri: \(uri)"
    case let .missingReadFilePermission(uri: uri):
      return "Missing read file permission for soure file at \(uri)"
    case let .fileDoesNotExist(uri: uri):
      return "File does not exist at URI: \(uri)"
    case .failedToInitializeAsset:
      return "Failed to initialize asset"
    }
  }
}

// MARK: - VideoViewError
enum VideoViewError: VideoError {
  case viewNotFound(nitroId: Double)
  
  var code: String {
    switch self {
    case .viewNotFound:
      return "view/not-found"
    }
  }
  
  var message: String {
    switch self {
    case let .viewNotFound(nitroId: nitroId):
      return "View with nitroId \(nitroId) not found"
    }
  }
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


