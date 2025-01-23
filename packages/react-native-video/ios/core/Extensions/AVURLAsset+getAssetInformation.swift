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
    }
    
    return videoInformation
  }
}