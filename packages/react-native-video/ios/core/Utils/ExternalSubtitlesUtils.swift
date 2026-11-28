import AVFoundation
import ObjectiveC

private var HLSSubtitleInjectorAssociatedKey: UInt8 = 0
private var SideloadedTextTracksAssociatedKey: UInt8 = 0

/// External subtitles added to a composition (non-HLS sources). A composition has no legible
/// media selection group, so these are listed and switched through the item's tracks.
final class SideloadedTextTracks {
  struct Track {
    let trackID: CMPersistentTrackID
    let label: String
    let language: String
  }

  let tracks: [Track]
  var selectedIndex: Int?

  init(tracks: [Track]) {
    self.tracks = tracks
    self.selectedIndex = tracks.isEmpty ? nil : 0
  }

  func apply(to item: AVPlayerItem) {
    for (index, track) in tracks.enumerated() {
      item.tracks.first { $0.assetTrack?.trackID == track.trackID }?.isEnabled =
        index == selectedIndex
    }
  }
}

extension AVPlayerItem {
  // An associated object, not AVPlayerItem state: set where the item is built, off the main actor
  nonisolated var sideloadedTextTracks: SideloadedTextTracks? {
    get {
      objc_getAssociatedObject(self, &SideloadedTextTracksAssociatedKey) as? SideloadedTextTracks
    }
    set {
      objc_setAssociatedObject(
        self,
        &SideloadedTextTracksAssociatedKey,
        newValue,
        .OBJC_ASSOCIATION_RETAIN_NONATOMIC
      )
    }
  }
}

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
    for asset: AVAsset,
    config: NativeVideoConfig
  ) async throws -> AVPlayerItem {
    let supportedSubtitles = (config.externalSubtitles ?? []).filter { subtitle in
      isSubtitleTypeSupported(subtitle: subtitle)
    }

    // The source's headers (e.g. auth cookies) also for its subtitles
    let assetOptions = ["AVURLAssetHTTPHeaderFieldsKey": config.headers ?? [:]]
    let subtitles: [(NativeExternalSubtitle, AVURLAsset)] = try supportedSubtitles.map { subtitle in
      guard let url = URL(string: subtitle.uri) else {
        throw PlayerError.invalidTrackUrl(url: subtitle.uri).error()
      }
      return (subtitle, AVURLAsset(url: url, options: assetOptions))
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

    var sideloaded: [SideloadedTextTracks.Track] = []

    for (subtitle, subtitleAsset) in subtitles {
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

        compSubtitleTrack.languageCode = subtitle.language
        compSubtitleTrack.isEnabled = true
        sideloaded.append(
          .init(
            trackID: compSubtitleTrack.trackID,
            label: subtitle.label,
            language: subtitle.language
          )
        )
      } catch {
        print("[ReactNativeVideo] Error inserting subtitle track: \(error.localizedDescription)")
        continue
      }
    }

    let playerItem = await AVPlayerItem(asset: composition)
    if !sideloaded.isEmpty {
      playerItem.sideloadedTextTracks = SideloadedTextTracks(tracks: sideloaded)
    }
    return playerItem
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
      externalSubtitles: supportedSubtitles,
      headers: config.headers ?? [:]
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
