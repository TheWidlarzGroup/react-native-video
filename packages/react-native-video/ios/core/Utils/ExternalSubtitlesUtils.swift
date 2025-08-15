import AVFoundation
import ObjectiveC

private var HLSSubtitleInjectorAssociatedKey: UInt8 = 0

enum ExternalSubtitlesUtils {
  static func isSubtitleTypeSupported(subtitle: NativeExternalSubtitle) -> Bool {
    if subtitle.type == .vtt {
      return true
    }

    if let url = URL(string: subtitle.uri), url.pathExtension == "vtt" {
      return true
    }

    return false
  }

  static func createCompositionWithExternalSubtitles(
    for asset: AVURLAsset,
    config: NativeVideoConfig
  ) async throws -> AVPlayerItem {
    let subtitlesAssets = try config.externalSubtitles?.map { subtitle in
      guard let url = URL(string: subtitle.uri) else {
        throw PlayerError.invalidTrackUrl(url: subtitle.uri).error()
      }

      return AVURLAsset(url: url)
    }

    do {
      let mainVideoTracks = asset.tracks(withMediaType: .video)
      let mainAudioTracks = asset.tracks(withMediaType: .audio)
      let textTracks =
        subtitlesAssets?.flatMap { $0.tracks(withMediaType: .text) } ?? []

      let composition = AVMutableComposition()

      if let videoTrack = mainVideoTracks.first(where: { $0.mediaType == .video }){
        if let compositionVideoTrack = composition.addMutableTrack(
          withMediaType: .video,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) {
          try compositionVideoTrack.insertTimeRange(
            CMTimeRange(start: .zero, duration: videoTrack.timeRange.duration),
            of: videoTrack,
            at: .zero
          )
        }
      }

      if let audioTrack = mainAudioTracks.first(where: { $0.mediaType == .audio }) {
        if let compositionAudioTrack = composition.addMutableTrack(
          withMediaType: .audio,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) {
          try compositionAudioTrack.insertTimeRange(
            CMTimeRange(start: .zero, duration: audioTrack.timeRange.duration),
            of: audioTrack,
            at: .zero
          )
        }
      }

      for textTrack in textTracks {
        if let compositionTextTrack = composition.addMutableTrack(
          withMediaType: .text,
          preferredTrackID: kCMPersistentTrackID_Invalid
        ) {
          try compositionTextTrack.insertTimeRange(
            CMTimeRange(start: .zero, duration: textTrack.timeRange.duration),
            of: textTrack,
            at: .zero
          )

          compositionTextTrack.languageCode = textTrack.languageCode
          compositionTextTrack.isEnabled = true
        }
      }

      return await AVPlayerItem(asset: composition)
    }
  }

  static func modifyStreamManifestWithExternalSubtitles(
    for asset: AVURLAsset,
    config: NativeVideoConfig
  ) async throws -> AVPlayerItem {
    guard let externalSubtitles = config.externalSubtitles,
      !externalSubtitles.isEmpty
    else {
      return AVPlayerItem(asset: asset)
    }

    let supportedSubtitles = externalSubtitles.filter { subtitle in
      isSubtitleTypeSupported(subtitle: subtitle)
    }

    guard !supportedSubtitles.isEmpty else {
      return AVPlayerItem(asset: asset)
    }

    let subtitleInjector = HLSSubtitleInjector(
      manifestUrl: asset.url,
      externalSubtitles: supportedSubtitles
    )
    let modifiedAsset = subtitleInjector.createModifiedAsset()
    let playerItem = AVPlayerItem(asset: modifiedAsset)

    objc_setAssociatedObject(
      playerItem,
      &HLSSubtitleInjectorAssociatedKey,
      subtitleInjector,
      .OBJC_ASSOCIATION_RETAIN_NONATOMIC
    )

    return playerItem
  }
}
