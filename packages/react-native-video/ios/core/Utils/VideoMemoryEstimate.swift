//
//  VideoMemoryEstimate.swift
//  ReactNativeVideo
//

import Foundation

/// What a player reports as `memorySize` to Nitro: an estimate of the media it buffers.
///
/// Nitro reads `memorySize` on the JS thread, every time the object crosses into JS, to tell
/// the garbage collector how much native memory the object holds. It must be cheap and close
/// to the memory a player really keeps, which is its forward buffer, not the whole file.
enum VideoMemoryEstimate {
  /// Reported while the bitrate is not known yet. The same as the Android fallback.
  static let minimumBytes = 1 << 20  // 1 MiB

  /// AVPlayer keeps a bounded buffer; a higher estimate only makes GC run for nothing.
  static let maximumBytes = 64 << 20  // 64 MiB

  /// AVPlayer's forward buffer when `preferredForwardBufferDuration` is left at 0 (automatic).
  static let defaultForwardBufferSeconds = 30.0

  static func bytes(bitrate: Double, forwardBufferSeconds: Double) -> Int {
    guard bitrate.isFinite, bitrate > 0 else { return minimumBytes }
    let seconds =
      forwardBufferSeconds.isFinite && forwardBufferSeconds > 0
      ? forwardBufferSeconds : defaultForwardBufferSeconds
    let bytes = bitrate / 8 * seconds
    guard bytes.isFinite else { return maximumBytes }
    return min(max(Int(bytes), minimumBytes), maximumBytes)
  }
}
