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
  ///
  /// `baseURL` is the URL the manifest itself was fetched from; when given, each
  /// variant's URI (the line that follows its `#EXT-X-STREAM-INF`) is resolved
  /// against it so callers get absolute rendition URLs. Passing `nil` keeps the
  /// URI exactly as the manifest spelled it.
  static func parseM3U8Manifest(_ content: String, baseURL: URL? = nil) throws -> HLSManifestInfo {
    let lines = content.components(separatedBy: .newlines)
    var info = HLSManifestInfo()

    // Set while walking the lines: an `#EXT-X-STREAM-INF` tag declares a variant
    // whose URI is the *next* non-blank, non-comment line, so the parsed
    // attributes have to be held until that line is reached.
    var pendingStreamIndex: Int?

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
        pendingStreamIndex = info.streams.count - 1
        continue
      }

      guard let index = pendingStreamIndex else { continue }

      // Blank lines and any other tag between the STREAM-INF and its URI are
      // skipped rather than mistaken for the URI.
      if trimmedLine.isEmpty || trimmedLine.hasPrefix("#") { continue }

      if let baseURL {
        info.streams[index].uri = URL(string: trimmedLine, relativeTo: baseURL)?.absoluteURL
          ?? URL(string: trimmedLine)
      } else {
        info.streams[index].uri = URL(string: trimmedLine)
      }
      pendingStreamIndex = nil
    }

    if !info.isValid {
      throw SourceError.invalidUri(uri: "Invalid M3U8 format").error()
    }

    return info
  }

  /// Splits an HLS attribute list on commas that are not inside a quoted string.
  ///
  /// Needed because attribute *values* legally contain commas
  /// (`CODECS="avc1.4d4020,mp4a.40.2"`), and because a naive substring search for
  /// `BANDWIDTH=` also matches inside `AVERAGE-BANDWIDTH=`.
  static func splitAttributeList(_ attributes: Substring) -> [Substring] {
    var parts: [Substring] = []
    var insideQuotes = false
    var startIndex = attributes.startIndex

    var index = attributes.startIndex
    while index < attributes.endIndex {
      let character = attributes[index]
      if character == "\"" {
        insideQuotes.toggle()
      } else if character == "," && !insideQuotes {
        parts.append(attributes[startIndex..<index])
        startIndex = attributes.index(after: index)
      }
      index = attributes.index(after: index)
    }
    parts.append(attributes[startIndex...])

    return parts
  }

  /// Parses EXT-X-STREAM-INF line to extract stream information
  private static func parseStreamInf(_ line: String) -> HLSStreamInfo {
    var streamInfo = HLSStreamInfo()

    guard let colonIndex = line.firstIndex(of: ":") else { return streamInfo }
    let attributes = line[line.index(after: colonIndex)...]

    for attribute in splitAttributeList(attributes) {
      guard let equalsIndex = attribute.firstIndex(of: "=") else { continue }
      let key = attribute[..<equalsIndex].trimmingCharacters(in: .whitespaces)
      var value = attribute[attribute.index(after: equalsIndex)...]
        .trimmingCharacters(in: .whitespaces)
      if value.hasPrefix("\"") && value.hasSuffix("\"") && value.count >= 2 {
        value = String(value.dropFirst().dropLast())
      }

      // Exact key matches only - `BANDWIDTH` and `AVERAGE-BANDWIDTH` are
      // different attributes and either may come first in the list.
      switch key {
      case "RESOLUTION":
        let components = value.components(separatedBy: "x")
        if components.count == 2 {
          streamInfo.width = Int(components[0])
          streamInfo.height = Int(components[1])
        }
      case "BANDWIDTH":
        streamInfo.bandwidth = Int(value)
      case "AVERAGE-BANDWIDTH":
        streamInfo.averageBandwidth = Int(value)
      default:
        break
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
  var averageBandwidth: Int?
  /// The variant playlist this `#EXT-X-STREAM-INF` points at, resolved against
  /// the master playlist's URL when `parseM3U8Manifest` was given one.
  var uri: URL?
}
