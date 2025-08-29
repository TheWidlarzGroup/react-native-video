import AVFoundation
import Foundation
import NitroModules

class HLSSubtitleInjector: NSObject {
  private let originalManifestUrl: URL
  private let externalSubtitles: [NativeExternalSubtitle]
  private var modifiedManifestContent: String?
  private static let customScheme = "rnv-hls"
  private static let subtitleScheme = "rnv-hls-subtitles"
  private static let subtitleGroupID = "rnv-subs"
  private static let resourceLoaderQueue = DispatchQueue(
    label: "com.nitro.HLSSubtitleInjector.resourceLoaderQueue",
    qos: .userInitiated
  )

  init(manifestUrl: URL, externalSubtitles: [NativeExternalSubtitle]) {
    self.originalManifestUrl = manifestUrl
    self.externalSubtitles = externalSubtitles
    super.init()
  }

  func createModifiedAsset() -> AVURLAsset {
    let customURL = createCustomURL(from: originalManifestUrl)
    let asset = AVURLAsset(url: customURL)
    asset.resourceLoader.setDelegate(
      self,
      queue: Self.resourceLoaderQueue
    )
    return asset
  }

  private func createCustomURL(from originalURL: URL) -> URL {
    var components = URLComponents(
      url: originalURL,
      resolvingAgainstBaseURL: false
    )!
    components.scheme = Self.customScheme
    return components.url!
  }

  private func getModifiedManifestContent() async throws -> String {
    if let cached = modifiedManifestContent {
      return cached
    }

    let originalContent = try await HLSManifestParser.downloadManifest(from: originalManifestUrl)
    let modifiedContent = try modifyM3U8Content(
      originalContent,
      with: externalSubtitles
    )
    modifiedManifestContent = modifiedContent
    return modifiedContent
  }

  private func modifyM3U8Content(
    _ originalContent: String,
    with externalSubtitles: [NativeExternalSubtitle]
  ) throws -> String {
    let lines = originalContent.components(separatedBy: .newlines)
    var modifiedLines: [String] = []
    var foundExtM3U = false
    var isAfterVersionOrM3U = false
    var hasSubtitleGroup = false
    let baseURL = originalManifestUrl.deletingLastPathComponent()

    for line in lines {
      let trimmedLine = line.trimmingCharacters(in: .whitespaces)

      if trimmedLine.hasPrefix("#EXTM3U") {
        foundExtM3U = true
        modifiedLines.append(line)
        isAfterVersionOrM3U = true
        continue
      }

      if isAfterVersionOrM3U && !hasSubtitleGroup
        && shouldInsertSubtitlesHere(line: trimmedLine)
      {
        for (index, subtitle) in externalSubtitles.enumerated() {
          let subtitleTrack = createSubtitleTrackEntry(for: subtitle, index: index)
          modifiedLines.append(subtitleTrack)
        }
        hasSubtitleGroup = true
        isAfterVersionOrM3U = false
      }

      let processedLine = HLSManifestParser.convertRelativeURLsToAbsolute(
        line: line,
        baseURL: baseURL
      )

      // Handle existing subtitle groups and stream info lines
      if trimmedLine.hasPrefix("#EXT-X-MEDIA:") && trimmedLine.contains("TYPE=SUBTITLES") {
        let modifiedMediaLine = replaceSubtitleGroupInMediaLine(processedLine)
        modifiedLines.append(modifiedMediaLine)
      } else if trimmedLine.hasPrefix("#EXT-X-STREAM-INF:") {
        let modifiedStreamLine = replaceSubtitleGroupInStreamInf(
          processedLine, hasSubtitleGroup: hasSubtitleGroup)
        modifiedLines.append(modifiedStreamLine)
      } else {
        modifiedLines.append(processedLine)
      }
    }

    if foundExtM3U && !hasSubtitleGroup {
      var finalLines: [String] = []
      var insertedSubtitles = false

      for line in modifiedLines {
        finalLines.append(line)

        if !insertedSubtitles
          && (line.hasPrefix("#EXTM3U") || line.hasPrefix("#EXT-X-VERSION"))
        {
          for (index, subtitle) in externalSubtitles.enumerated() {
            let subtitleTrack = createSubtitleTrackEntry(for: subtitle, index: index)
            finalLines.append(subtitleTrack)
          }
          insertedSubtitles = true
        }
      }

      modifiedLines = finalLines
    }

    if !foundExtM3U {
      throw SourceError.invalidUri(uri: originalManifestUrl.absoluteString)
        .error()
    }

    // Post-process: ensure every variant stream references our subtitle group if we injected it
    if hasSubtitleGroup {
      modifiedLines = modifiedLines.map { line in
        if line.hasPrefix("#EXT-X-STREAM-INF:") && !line.contains("SUBTITLES=") {
          if line.hasSuffix(",") {
            return line + "SUBTITLES=\"\(Self.subtitleGroupID)\""
          } else {
            return line + ",SUBTITLES=\"\(Self.subtitleGroupID)\""
          }
        }
        return line
      }
    }

    return modifiedLines.joined(separator: "\n")
  }

  private func shouldInsertSubtitlesHere(line: String) -> Bool {
    return line.hasPrefix("#EXT-X-STREAM-INF:")
      || line.hasPrefix("#EXT-X-I-FRAME-STREAM-INF:")
      || line.hasPrefix("#EXT-X-MEDIA:")
      || line.hasPrefix("#EXTINF:")
      || line.hasPrefix("#EXT-X-BYTERANGE:")
      || (!line.hasPrefix("#") && !line.isEmpty
        && !line.hasPrefix("#EXT-X-VERSION"))
  }

  private func replaceSubtitleGroupInMediaLine(_ line: String) -> String {
    // Find and replace GROUP-ID in subtitle media lines
    let groupIdPattern = #"GROUP-ID="[^"]*""#

    if let regex = try? NSRegularExpression(pattern: groupIdPattern, options: []) {
      let range = NSRange(location: 0, length: line.utf16.count)
      let replacement = "GROUP-ID=\"\(Self.subtitleGroupID)\""
      return regex.stringByReplacingMatches(
        in: line, options: [], range: range, withTemplate: replacement)
    }

    return line
  }

  private func replaceSubtitleGroupInStreamInf(_ line: String, hasSubtitleGroup: Bool) -> String {
    // First, handle existing SUBTITLES= references
    let subtitlesPattern = #"SUBTITLES="[^"]*""#

    var modifiedLine = line
    if let regex = try? NSRegularExpression(pattern: subtitlesPattern, options: []) {
      let range = NSRange(location: 0, length: line.utf16.count)
      let replacement = "SUBTITLES=\"\(Self.subtitleGroupID)\""
      modifiedLine = regex.stringByReplacingMatches(
        in: line, options: [], range: range, withTemplate: replacement)
    } else if hasSubtitleGroup && !line.contains("SUBTITLES=") {
      // Add subtitle group reference if we have subtitles but no existing reference
      if line.hasSuffix(",") {
        modifiedLine = line + "SUBTITLES=\"\(Self.subtitleGroupID)\""
      } else {
        modifiedLine = line + ",SUBTITLES=\"\(Self.subtitleGroupID)\""
      }
    }

    return modifiedLine
  }

  private func createSubtitleTrackEntry(for subtitle: NativeExternalSubtitle, index: Int)
    -> String
  {
    let subtitleM3U8URI = "\(Self.subtitleScheme)://\(index)/subtitle.m3u8"

    return
      "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"\(Self.subtitleGroupID)\",NAME=\"\(subtitle.label)\",DEFAULT=NO,AUTOSELECT=NO,FORCED=NO,LANGUAGE=\"\(subtitle.language)\",URI=\"\(subtitleM3U8URI)\""
  }
}

// MARK: - AVAssetResourceLoaderDelegate

extension HLSSubtitleInjector: AVAssetResourceLoaderDelegate {
  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    shouldWaitForLoadingOfRequestedResource loadingRequest:
      AVAssetResourceLoadingRequest
  ) -> Bool {

    guard let url = loadingRequest.request.url else {
      return false
    }

    switch url.scheme {
    case Self.customScheme:
      return handleMainManifest(url: url, loadingRequest: loadingRequest)
    case Self.subtitleScheme:
      return handleSubtitleM3U8(url: url, loadingRequest: loadingRequest)
    default:
      return false
    }
  }

  private func handleMainManifest(url: URL, loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    guard url.path.hasSuffix(".m3u8") else {
      return false
    }

    Task {
      do {
        let modifiedContent = try await getModifiedManifestContent()

        guard let data = modifiedContent.data(using: .utf8) else {
          throw SourceError.invalidUri(uri: "Failed to encode manifest content")
            .error()
        }

        if let contentRequest = loadingRequest.contentInformationRequest {
          contentRequest.contentType = "application/x-mpegURL"
          contentRequest.contentLength = Int64(data.count)
          contentRequest.isByteRangeAccessSupported = true
        }

        if let dataRequest = loadingRequest.dataRequest {
          let requestedData: Data

          if dataRequest.requestedOffset > 0 || dataRequest.requestedLength > 0 {
            let offset = Int(dataRequest.requestedOffset)
            let length =
              dataRequest.requestedLength > 0
              ? min(Int(dataRequest.requestedLength), data.count - offset)
              : data.count - offset

            if offset < data.count && length > 0 {
              requestedData = data.subdata(in: offset..<(offset + length))
            } else {
              requestedData = Data()
            }
          } else {
            requestedData = data
          }

          dataRequest.respond(with: requestedData)
        }

        loadingRequest.finishLoading()
      } catch {
        loadingRequest.finishLoading(with: error)
      }
    }

    return true
  }

  private func handleSubtitleM3U8(url: URL, loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    guard let indexString = url.host, let index = Int(indexString) else {
      return false
    }

    guard index < externalSubtitles.count else {
      return false
    }

    let subtitle = externalSubtitles[index]

    Task {
      do {
        guard let subtitleURL = URL(string: subtitle.uri) else {
          throw SourceError.invalidUri(uri: "Invalid subtitle URI: \(subtitle.uri)").error()
        }

        let (vttData, response) = try await URLSession.shared.data(from: subtitleURL)

        guard let httpResponse = response as? HTTPURLResponse,
          200...299 ~= httpResponse.statusCode
        else {
          throw SourceError.invalidUri(uri: "Subtitle request failed with status: \(response)")
            .error()
        }

        guard let vttString = String(data: vttData, encoding: .utf8) else {
          throw SourceError.invalidUri(uri: "Failed to decode VTT content").error()
        }

        let duration = extractDurationFromVTT(vttString)

        let m3u8Wrapper = """
          #EXTM3U
          #EXT-X-VERSION:3
          #EXT-X-MEDIA-SEQUENCE:1
          #EXT-X-PLAYLIST-TYPE:VOD
          #EXT-X-ALLOW-CACHE:NO
          #EXT-X-TARGETDURATION:\(Int(duration))
          #EXTINF:\(String(format: "%.3f", duration)), no desc
          \(subtitle.uri)
          #EXT-X-ENDLIST
          """

        guard let m3u8Data = m3u8Wrapper.data(using: .utf8) else {
          throw SourceError.invalidUri(uri: "Failed to create M3U8 wrapper").error()
        }

        if let contentRequest = loadingRequest.contentInformationRequest {
          contentRequest.contentType = "application/x-mpegURL"
          contentRequest.contentLength = Int64(m3u8Data.count)
          contentRequest.isByteRangeAccessSupported = true
        }

        if let dataRequest = loadingRequest.dataRequest {
          dataRequest.respond(with: m3u8Data)
        }

        loadingRequest.finishLoading()
      } catch {
        loadingRequest.finishLoading(with: error)
      }
    }

    return true
  }

  private func extractDurationFromVTT(_ vttString: String) -> Double {
    // Extract duration from VTT timestamps (similar to the PR approach)
    let timestampPattern = #"(?:(\d+):)?(\d+):([\d\.]+)"#

    guard let regex = try? NSRegularExpression(pattern: timestampPattern, options: []) else {
      return 60.0  // Default fallback
    }

    let matches = regex.matches(
      in: vttString,
      options: [],
      range: NSRange(location: 0, length: vttString.utf16.count)
    )

    guard let lastMatch = matches.last,
      let range = Range(lastMatch.range, in: vttString)
    else {
      return 60.0  // Default fallback
    }

    let lastTimestampString = String(vttString[range])
    let components = lastTimestampString.components(separatedBy: ":").reversed()
      .compactMap { Double($0) }
      .enumerated()
      .map { pow(60.0, Double($0.offset)) * $0.element }
      .reduce(0, +)

    return max(components, 1.0)  // Ensure at least 1 second
  }

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    didCancel loadingRequest: AVAssetResourceLoadingRequest
  ) {
  }
}
