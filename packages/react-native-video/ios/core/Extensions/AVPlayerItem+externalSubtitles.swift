//
//  AVPlayerItem+externalSubtitles.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 08/05/2025.
//

import Foundation
import AVFoundation

extension AVPlayerItem {
  static func withExternalSubtitles(for asset: AVURLAsset, config: NativeVideoConfig) async throws -> AVPlayerItem {
    let subtitlesAssets = config.externalSubtitles?.map { subtitle in
      let url = URL(string: subtitle.uri)
      return AVURLAsset(url: url!)
    }
    
    do {
      let mainVideoTracks = asset.tracks(withMediaType: .video)
      let mainAudioTracks = asset.tracks(withMediaType: .audio)
      let textTracks = subtitlesAssets?.flatMap { $0.tracks(withMediaType: .text) } ?? []
      
      guard let videoTrack = mainVideoTracks.first(where: { $0.mediaType == .video }),
            let audioTrack = mainAudioTracks.first(where: { $0.mediaType == .audio })
      else {
        print("Could not find required tracks.")
        // TODO: Create Error for this case
        throw PlayerError.invalidSource.error()
      }
      
      let composition = AVMutableComposition()
      
      // Add video track
      if let compositionVideoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) {
        try compositionVideoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoTrack.timeRange.duration), of: videoTrack, at: .zero)
      }
      
      // Add audio track
      if let compositionAudioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
        try compositionAudioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: audioTrack.timeRange.duration), of: audioTrack, at: .zero)
      }
      
      for textTrack in textTracks {
        // Add subtitle track
        if let compositionTextTrack = composition.addMutableTrack(withMediaType: .text, preferredTrackID: kCMPersistentTrackID_Invalid) {
          try compositionTextTrack.insertTimeRange(CMTimeRange(start: .zero, duration: textTrack.timeRange.duration), of: textTrack, at: .zero)
          
          compositionTextTrack.languageCode = textTrack.languageCode
        }
      }
      
      return AVPlayerItem(asset: composition)
    }
  }
}
