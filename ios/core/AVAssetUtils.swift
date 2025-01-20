//
//  AVAssetUtils.swift
//  Pods
//
//  Created by Krzysztof Moch on 16/01/2025.
//
import AVFoundation

public final class AVAssetUtils {
  public static func getAssetInformation(for asset: AVURLAsset) async throws -> VideoInformation {
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
    
    videoInformation.fileSize = try await getFileSize(for: asset.url)
    
    // Check if asset is live stream
    if asset.duration.flags.contains(.indefinite) {
      videoInformation.duration = -1
      videoInformation.isLive = true
    } else {
      videoInformation.duration = Int64(CMTimeGetSeconds(asset.duration))
      videoInformation.isLive = false
    }
    
    if let videoTrack = asset.tracks(withMediaType: .video).first {
      let size = videoTrack.naturalSize.applying(videoTrack.preferredTransform)
      videoInformation.width = size.width
      videoInformation.height = size.height
      
      videoInformation.bitrate = Double(videoTrack.estimatedDataRate)
      
      videoInformation.orientation = getVideoOrientation(videoTrack: videoTrack)
      
      if #available(iOS 14.0, tvOS 14.0, visionOS 1.0, *) {
        videoInformation.isHDR = videoTrack.hasMediaCharacteristic(.containsHDRVideo)
      }
    }
    
    return videoInformation
  }
  
  public static func getFileSize(for url: URL) async throws -> Int64 {
    if url.isFileURL {
      return try Int64(url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? -1)
    }
    
    // Try to get file size from remote server
    // Make HEAD request to get content length
    // If content length is not available, returns -1
    
    var request = URLRequest(url: url)
    request.httpMethod = "HEAD"
    
    let (_, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      return -1
    }
    
    let contentLength = httpResponse.allHeaderFields["Content-Length"] as? String
    return Int64(contentLength ?? "-1") ?? -1
  }
  
  public static func getVideoOrientation(videoTrack: AVAssetTrack) -> VideoOrientation {
    let transform = videoTrack.preferredTransform
    let size = videoTrack.naturalSize.applying(transform)
    
    // Check if video is portrait or landscape
    let isNaturalSizePortrait = size.width < size.height
    
    // Calculate video rotation
    let angle = atan2(Double(transform.b), Double(transform.a))
    let degrees = angle * 180 / .pi
    let rotation = degrees < 0 ? degrees + 360 : degrees
    
    switch rotation {
    case 0:
      return isNaturalSizePortrait ? .portrait : .landscapeRight
    case 90, -270:
      return .portrait
    case 180, -180:
      return isNaturalSizePortrait ? .portraitUpsideDown : .landscapeLeft
    case 270, -90:
      return .portraitUpsideDown
    default:
      return isNaturalSizePortrait ? .portrait : .landscape
    }
  }
}
