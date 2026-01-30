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

    print("[ReactNativeVideo] Unsupported external subtitle. Expected VTT. uri: \(subtitle.uri)")
    return false
  }

  static func createCompositionWithExternalSubtitles(
    for asset: AVURLAsset,
    config: NativeVideoConfig
  ) async throws -> AVPlayerItem {
    let supportedSubtitles = (config.externalSubtitles ?? []).filter { subtitle in
      isSubtitleTypeSupported(subtitle: subtitle)
    }

    let subtitleAssets: [AVURLAsset] = try supportedSubtitles.map { subtitle in
      guard let url = URL(string: subtitle.uri) else {
        throw PlayerError.invalidTrackUrl(url: subtitle.uri).error()
      }
      return AVURLAsset(url: url)
    }

    let mainDuration = try await asset.load(.duration)

    let composition = AVMutableComposition()

    let tracks = try await asset.load(.tracks)
    for track in tracks {
      guard let compTrack = composition.addMutableTrack(
        withMediaType: track.mediaType,
        preferredTrackID: kCMPersistentTrackID_Invalid
      ) else { continue }

      do {
        try compTrack.insertTimeRange(
          CMTimeRange(start: .zero, duration: mainDuration),
          of: track,
          at: .zero
        )
      } catch {
        print("[ReactNativeVideo] Error inserting main track \(track.mediaType.rawValue): \(error.localizedDescription)")
      }
    }

    for subtitleAsset in subtitleAssets {
      let track: AVAssetTrack? = try await subtitleAsset.loadTracks(withMediaType: .text).first

      guard let track else { continue }

      guard let compSubtitleTrack = composition.addMutableTrack(
        withMediaType: track.mediaType,
        preferredTrackID: kCMPersistentTrackID_Invalid
      ) else { continue }

      do {
        let trackRange = try await track.load(.timeRange)
        let effectiveDuration = CMTimeMinimum(trackRange.duration, mainDuration)
        try compSubtitleTrack.insertTimeRange(
          CMTimeRange(start: .zero, duration: effectiveDuration),
          of: track,
          at: .zero
        )
          
        compSubtitleTrack.languageCode = try await track.load(.languageCode)
        compSubtitleTrack.isEnabled = true
      } catch {
        print("[ReactNativeVideo] Error inserting subtitle track: \(error.localizedDescription)")
        continue
      }
    }

    return await AVPlayerItem(asset: composition)
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
