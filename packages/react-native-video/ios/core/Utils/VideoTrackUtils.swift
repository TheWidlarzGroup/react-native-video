//
//  VideoTrackUtils.swift
//  ReactNativeVideo
//
//  Enumerates the video renditions (quality levels) of a source, for
//  YouTube-style manual quality selection.
//

import AVFoundation
import Foundation

/// One video rendition of the current source.
///
/// Kept as a plain Swift value rather than the Nitro `VideoTrack` C++ struct so
/// the player can do arithmetic on `bitrate` (cap computation, access-log
/// nearest-matching) without round-tripping through the bridge, and so
/// `selected` can be re-derived from the player's own state on every read.
struct VideoRendition: Equatable {
  /// Stable for the lifetime of a manifest: the index into the
  /// descending-by-quality sorted list, *not* the manifest's own ordering
  /// (which HLS does not require to be sorted at all).
  let id: String
  let label: String
  let width: Int
  let height: Int
  let bitrate: Int

  /// The short edge, i.e. what a viewer calls "1080p". Portrait content
  /// declares `RESOLUTION=1080x1920`, landscape `1920x1080`; both are "1080p".
  var shortEdge: Int { min(width, height) }

  func videoTrack(selected: Bool) -> VideoTrack {
    VideoTrack(
      id: id,
      label: label,
      language: nil,
      selected: selected,
      width: Double(width),
      height: Double(height),
      bitrate: Double(bitrate)
    )
  }
}

enum VideoTrackUtils {

  /// Loads the rendition ladder for `url`.
  ///
  /// Only HLS master playlists carry a rendition ladder that AVFoundation will
  /// switch between, so anything else returns an empty list (the UI layer hides
  /// its quality control when there is nothing to choose from). The gate matches
  /// the existing one in `AVURLAsset.getAssetInformation()`.
  ///
  /// This is a second HTTP request for the master playlist - AVPlayer fetches it
  /// too but exposes none of it - so callers are expected to cache the result
  /// per source.
  static func loadRenditions(from url: URL) async throws -> [VideoRendition] {
    guard url.pathExtension == "m3u8" else { return [] }

    let manifest = try await HLSManifestParser.downloadManifest(from: url)
    let info = try HLSManifestParser.parseM3U8Manifest(manifest, baseURL: url)

    return renditions(from: info.streams)
  }

  /// Turns parsed `#EXT-X-STREAM-INF` entries into a sorted, labelled ladder.
  /// Split out from `loadRenditions` so it is testable without a network round
  /// trip.
  static func renditions(from streams: [HLSStreamInfo]) -> [VideoRendition] {
    // A variant with no RESOLUTION is an audio-only or metadata rendition: it is
    // not something a viewer can pick as a "quality", and it has no size to cap
    // against, so it is dropped.
    let usable = streams.compactMap { stream -> (width: Int, height: Int, bitrate: Int)? in
      guard let width = stream.width, let height = stream.height, width > 0, height > 0 else {
        return nil
      }
      // Fall back to AVERAGE-BANDWIDTH, then to 0, so a manifest missing
      // BANDWIDTH still enumerates rather than disappearing.
      let bitrate = stream.bandwidth ?? stream.averageBandwidth ?? 0
      return (width, height, bitrate)
    }

    // Best first. Pixel count is the primary key so that a high-bitrate 480p
    // never sorts above a 1080p; bitrate breaks ties between same-resolution
    // renditions.
    let sorted = usable.sorted { lhs, rhs in
      let lhsPixels = lhs.width * lhs.height
      let rhsPixels = rhs.width * rhs.height
      if lhsPixels != rhsPixels { return lhsPixels > rhsPixels }
      return lhs.bitrate > rhs.bitrate
    }

    // Only disambiguate with a bitrate suffix where it is actually needed, i.e.
    // where two or more renditions would otherwise both read "1080p".
    var shortEdgeCounts: [Int: Int] = [:]
    for entry in sorted {
      shortEdgeCounts[min(entry.width, entry.height), default: 0] += 1
    }

    return sorted.enumerated().map { index, entry in
      let shortEdge = min(entry.width, entry.height)
      var label = "\(shortEdge)p"
      if (shortEdgeCounts[shortEdge] ?? 0) > 1, entry.bitrate > 0 {
        let mbps = Double(entry.bitrate) / 1_000_000.0
        label += String(format: " - %.1f Mbps", mbps)
      }

      return VideoRendition(
        id: "hls-\(index)",
        label: label,
        width: entry.width,
        height: entry.height,
        bitrate: entry.bitrate
      )
    }
  }

  /// The rendition whose bitrate is closest to `bitrate`, used to map the
  /// player's access-log `indicatedBitrate` back onto a track id.
  static func nearestRendition(
    to bitrate: Double,
    in renditions: [VideoRendition]
  ) -> VideoRendition? {
    guard bitrate.isFinite, bitrate > 0 else { return nil }
    return renditions.min {
      abs(Double($0.bitrate) - bitrate) < abs(Double($1.bitrate) - bitrate)
    }
  }
}
