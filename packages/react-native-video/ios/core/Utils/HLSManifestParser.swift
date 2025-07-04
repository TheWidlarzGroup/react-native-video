import AVFoundation
import Foundation
import NitroModules

class HLSManifestParser {

  /// Downloads manifest content from the given URL
  static func downloadManifest(from url: URL) async throws -> String {
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
      200...299 ~= httpResponse.statusCode
    else {
      throw SourceError.invalidUri(uri: url.absoluteString).error()
    }

    guard let manifestContent = String(data: data, encoding: .utf8) else {
      throw SourceError.invalidUri(uri: url.absoluteString).error()
    }

    return manifestContent
  }

  /// Converts relative URLs in a manifest line to absolute URLs
  static func convertRelativeURLsToAbsolute(line: String, baseURL: URL) -> String {
    let trimmedLine = line.trimmingCharacters(in: .whitespaces)

    if trimmedLine.isEmpty {
      return line
    }

    if trimmedLine.hasPrefix("#") {
      if trimmedLine.contains("URI=") {
        return convertURIParametersToAbsolute(line: line, baseURL: baseURL)
      }
      return line
    }

    if !trimmedLine.hasPrefix("http://") && !trimmedLine.hasPrefix("https://") {
      let absoluteURL = baseURL.appendingPathComponent(trimmedLine)
      return absoluteURL.absoluteString
    }

    return line
  }

  /// Converts URI parameters in manifest lines to absolute URLs
  static func convertURIParametersToAbsolute(line: String, baseURL: URL) -> String {
    var modifiedLine = line
    let uriPattern = #"URI="([^"]+)""#

    guard let regex = try? NSRegularExpression(pattern: uriPattern, options: [])
    else {
      return line
    }

    let nsLine = line as NSString
    let matches = regex.matches(
      in: line,
      options: [],
      range: NSRange(location: 0, length: nsLine.length)
    )

    for match in matches.reversed() {
      if match.numberOfRanges >= 2 {
        let uriRange = match.range(at: 1)
        let uri = nsLine.substring(with: uriRange)

        if !uri.hasPrefix("http://") && !uri.hasPrefix("https://") {
          let absoluteURL = baseURL.appendingPathComponent(uri)
          let fullRange = match.range(at: 0)
          let replacement = "URI=\"\(absoluteURL.absoluteString)\""
          modifiedLine = (modifiedLine as NSString).replacingCharacters(
            in: fullRange,
            with: replacement
          )
        }
      }
    }

    return modifiedLine
  }

  /// Parses M3U8 manifest content and returns parsed information
  static func parseM3U8Manifest(_ content: String) throws -> HLSManifestInfo {
    let lines = content.components(separatedBy: .newlines)
    var info = HLSManifestInfo()

    for line in lines {
      let trimmedLine = line.trimmingCharacters(in: .whitespaces)

      if trimmedLine.hasPrefix("#EXTM3U") {
        info.isValid = true
      }

      // Parse version
      if trimmedLine.hasPrefix("#EXT-X-VERSION:") {
        let versionString = String(trimmedLine.dropFirst("#EXT-X-VERSION:".count))
        info.version = Int(versionString)
      }

      // Parse stream info for resolution
      if trimmedLine.hasPrefix("#EXT-X-STREAM-INF:") {
        let streamInfo = parseStreamInf(trimmedLine)
        info.streams.append(streamInfo)
      }
    }

    if !info.isValid {
      throw SourceError.invalidUri(uri: "Invalid M3U8 format").error()
    }

    return info
  }

  /// Parses EXT-X-STREAM-INF line to extract stream information
  private static func parseStreamInf(_ line: String) -> HLSStreamInfo {
    var streamInfo = HLSStreamInfo()

    // Parse RESOLUTION
    if let resolutionRange = line.range(of: "RESOLUTION=") {
      let afterResolution = line[resolutionRange.upperBound...]
      if let commaRange = afterResolution.range(of: ",") {
        let resolutionValue = String(afterResolution[..<commaRange.lowerBound])
        let components = resolutionValue.components(separatedBy: "x")
        if components.count == 2 {
          streamInfo.width = Int(components[0])
          streamInfo.height = Int(components[1])
        }
      } else {
        // Resolution is at the end of the line
        let resolutionValue = String(afterResolution)
        let components = resolutionValue.components(separatedBy: "x")
        if components.count == 2 {
          streamInfo.width = Int(components[0])
          streamInfo.height = Int(components[1])
        }
      }
    }

    // Parse BANDWIDTH
    if let bandwidthRange = line.range(of: "BANDWIDTH=") {
      let afterBandwidth = line[bandwidthRange.upperBound...]
      if let commaRange = afterBandwidth.range(of: ",") {
        let bandwidthValue = String(afterBandwidth[..<commaRange.lowerBound])
        streamInfo.bandwidth = Int(bandwidthValue)
      } else {
        // Bandwidth is at the end of the line
        let bandwidthValue = String(afterBandwidth)
        streamInfo.bandwidth = Int(bandwidthValue)
      }
    }

    return streamInfo
  }
}

// MARK: - Data Structures

struct HLSManifestInfo {
  var isValid: Bool = false
  var version: Int?
  var streams: [HLSStreamInfo] = []
}

struct HLSStreamInfo {
  var width: Int?
  var height: Int?
  var bandwidth: Int?
}
