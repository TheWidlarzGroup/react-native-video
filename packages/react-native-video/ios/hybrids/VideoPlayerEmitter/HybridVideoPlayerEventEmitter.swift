//
//  HybridVideoPlayerEventEmitter.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 02/05/2025.
//

import Foundation
import NitroModules

class HybridVideoPlayerEventEmitter: HybridVideoPlayerEventEmitterSpec {
  var onAudioBecomingNoisy: (() -> Void) = {}
  
  var onAudioFocusChange: ((Bool) -> Void) = { _ in }
  
  var onBandwidthUpdate: ((BandwidthData) -> Void) = { _ in }
  
  var onBuffer: ((Bool) -> Void) = { _ in }
  
  var onControlsVisibleChange: ((Bool) -> Void) = { _ in }
  
  var onEnd: (() -> Void) = {}
  
  var onExternalPlaybackChange: ((Bool) -> Void) = { _ in }
  
  var onLoad: ((onLoadData) -> Void) = { _ in }
  
  var onLoadStart: ((onLoadStartData) -> Void) = { _ in }
  
  var onPlaybackStateChange: ((onPlaybackStateChangeData) -> Void) = { _ in }
  
  var onPlaybackRateChange: ((Double) -> Void) = { _ in }
  
  var onProgress: ((onProgressData) -> Void) = { _ in }
  
  var onReadyToDisplay: (() -> Void) = {}
  
  var onSeek: ((Double) -> Void) = { _ in }
  
  var onStatusChange: (VideoPlayerStatus) -> Void = { _ in }
  
  var onTimedMetadata: ((TimedMetadata) -> Void) = { _ in }
  
  var onTextTrackDataChanged: ([String]) -> Void = { _ in }
  
  var onTrackChange: ((TextTrack?) -> Void) = { _ in }
  
  var onVolumeChange: ((onVolumeChangeData) -> Void) = { _ in }
}
