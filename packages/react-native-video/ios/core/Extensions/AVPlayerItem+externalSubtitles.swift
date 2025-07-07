//
//  AVPlayerItem+externalSubtitles.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 08/05/2025.
//

import AVFoundation
import Foundation

extension AVPlayerItem {
  static func withExternalSubtitles(for asset: AVURLAsset, config: NativeVideoConfig) async throws
    -> AVPlayerItem
  {
    if config.externalSubtitles?.isEmpty != false {
      return AVPlayerItem(asset: asset)
    }

    if asset.url.pathExtension == "m3u8" {
      let supportedExternalSubtitles = config.externalSubtitles?.filter { subtitle in
        ExternalSubtitlesUtils.isSubtitleTypeSupported(subtitle: subtitle)
      }

      if supportedExternalSubtitles?.isEmpty == true {
        return AVPlayerItem(asset: asset)
      } else {
        return try await ExternalSubtitlesUtils.modifyStreamManifestWithExternalSubtitles(
          for: asset, config: config)
      }
    }

    return try await ExternalSubtitlesUtils.createCompositionWithExternalSubtitles(
      for: asset, config: config)
  }
}
