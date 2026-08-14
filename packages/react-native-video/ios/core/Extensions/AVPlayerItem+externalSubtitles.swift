//
//  AVPlayerItem+externalSubtitles.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 08/05/2025.
//

import AVFoundation
import Foundation

extension AVPlayerItem {
  static func withExternalSubtitles(for asset: AVAsset, config: NativeVideoConfig) async throws
    -> AVPlayerItem
  {
    if config.externalSubtitles?.isEmpty != false {
      return AVPlayerItem(asset: asset)
    }

    let supportedExternalSubtitles = config.externalSubtitles?.filter { subtitle in
      ExternalSubtitlesUtils.isSubtitleTypeSupported(subtitle: subtitle)
    }

    if supportedExternalSubtitles?.isEmpty == true {
      return AVPlayerItem(asset: asset)
    }

    if let urlAsset = asset as? AVURLAsset,
      urlAsset.url.pathExtension.lowercased() == "m3u8"
    {
      return try await ExternalSubtitlesUtils.modifyStreamManifestWithExternalSubtitles(
        for: urlAsset, config: config)
    }

    return try await ExternalSubtitlesUtils.createCompositionWithExternalSubtitles(
      for: asset, config: config)
  }
}
