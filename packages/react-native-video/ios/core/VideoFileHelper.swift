import Foundation

//TODO: Move errors to enums, then remove this import
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
      throw RuntimeError.error(withMessage: "Cannot read file at path: \(url.path), is path \(url.path) correct? Does app have permission to read file?")
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
      throw RuntimeError.error(withMessage: "Invalid content length for URL: \(url)")
    }
    
    return size
  }
} 
