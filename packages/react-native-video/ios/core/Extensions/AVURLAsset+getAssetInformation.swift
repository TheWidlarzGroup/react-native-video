import AVFoundation

extension AVURLAsset {
  func getAssetInformation() async throws -> VideoInformation {
    // Initialize with default values
    var videoInformation = VideoInformation(
      bitrate: Double.nan,
      width: Double.nan,
      height: Double.nan,
      duration: -1,
      fileSize: -1,
      isHDR: false,
      isLive: false,
      orientation: .unknown
    )

    videoInformation.fileSize = try await VideoFileHelper.getFileSize(for: url)

    // Check if asset is live stream
    if duration.flags.contains(.indefinite) {
      videoInformation.duration = -1
      videoInformation.isLive = true
    } else {
      videoInformation.duration = Int64(CMTimeGetSeconds(duration))
      videoInformation.isLive = false
    }

    if let videoTrack = tracks(withMediaType: .video).first {
      let size = videoTrack.naturalSize.applying(videoTrack.preferredTransform)
      videoInformation.width = size.width
      videoInformation.height = size.height

      videoInformation.bitrate = Double(videoTrack.estimatedDataRate)

      videoInformation.orientation = videoTrack.orientation

      if #available(iOS 14.0, tvOS 14.0, visionOS 1.0, *) {
        videoInformation.isHDR = videoTrack.hasMediaCharacteristic(.containsHDRVideo)
      }
    } else if url.pathExtension == "m3u8" {
      // For HLS streams, we cannot get video track information directly
      // So we download manifest and try to extract video information from it

      let manifestContent = try await HLSManifestParser.downloadManifest(from: url)
      let manifestInfo = try HLSManifestParser.parseM3U8Manifest(manifestContent)

      if let videoStream = manifestInfo.streams.first {
        videoInformation.width = Double(videoStream.width ?? Int(Double.nan))
        videoInformation.height = Double(videoStream.height ?? Int(Double.nan))
        videoInformation.bitrate = Double(videoStream.bandwidth ?? Int(Double.nan))
      }

      if videoInformation.width > 0 && videoInformation.height > 0 {
        if videoInformation.width == videoInformation.height {
          videoInformation.orientation = .square
        } else if videoInformation.width > videoInformation.height {
          videoInformation.orientation = .landscapeRight
        } else if videoInformation.width < videoInformation.height {
          videoInformation.orientation = .portrait
        } else {
          videoInformation.orientation = .unknown
        }
      }
    }

    return videoInformation
  }
}
