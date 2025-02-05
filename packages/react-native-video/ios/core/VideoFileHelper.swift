//
//  VideoFileHelper.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 23/01/2025.
//

import Foundation
import NitroModules

enum VideoFileHelper {
  private static let fileManager = FileManager.default
  
  static func getFileSize(for url: URL) async throws -> Int64 {
    if url.isFileURL {
      return try getLocalFileSize(for: url)
    }
    return try await getRemoteFileSize(for: url)
  }
  
  static func validateReadPermission(for url: URL) throws {
    guard url.isFileURL else { return }
    
    if !fileManager.isReadableFile(atPath: url.path) {
      throw SourceError.missingReadFilePermission(uri: url.path).error()
    }
  }
  
  // MARK: - Private
  
  private static func getLocalFileSize(for url: URL) throws -> Int64 {
    Int64(try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? -1)
  }
  
  private static func getRemoteFileSize(for url: URL) async throws -> Int64 {
    var request = URLRequest(url: url)
    request.httpMethod = "HEAD"
    
    let (_, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse,
          let contentLength = httpResponse.allHeaderFields["Content-Length"] as? String,
          let size = Int64(contentLength) else {
      return -1
    }
    
    return size
  }
}
