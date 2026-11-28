//
//  HybridVideoPlayerEventEmitter.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 02/05/2025.
//

import Foundation
import NitroModules

private struct ListenerPair {
  let id: UUID
  let eventName: String
  let callback: Any
}

class HybridVideoPlayerEventEmitter: HybridVideoPlayerEventEmitterSpec {
  private let listeners = ListenerStore<ListenerPair>()

  // The load that is in progress, from onLoadStart until the status leaves "loading".
  // A player starts loading when it is created, before JS can add a listener, so a listener
  // added while the load is still running is told about it right away.
  // `loadStartLock` covers this value together with adding or reading the onLoadStart
  // listeners, so a listener gets a load either from onLoadStart() or on registration, never both.
  private let loadStartLock = NSLock()
  private var loadInProgress: onLoadStartData?

  // MARK: - Private helpers

  private func addListener<T>(eventName: String, listener: T) -> ListenerSubscription {
    let id = UUID()
    listeners.append(ListenerPair(id: id, eventName: eventName, callback: listener))
    return ListenerSubscription(remove: { [weak self] in
      self?.listeners.removeAll { $0.id == id }
    })
  }

  private func emitEvent<T>(eventName: String, invoke: (T) throws -> Void) {
    for pair in listeners.snapshot() where pair.eventName == eventName {
      if let callback = pair.callback as? T {
        do {
          try invoke(callback)
        } catch {
          print("[ReactNativeVideo] Error calling \(eventName) listener: \(error)")
        }
      } else {
        print("[ReactNativeVideo] Invalid callback type for \(eventName)")
      }
    }
  }

  // MARK: - Listener registration methods

  func addOnAudioBecomingNoisyListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onAudioBecomingNoisy", listener: listener)
  }

  func addOnAudioFocusChangeListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onAudioFocusChange", listener: listener)
  }

  func addOnBandwidthUpdateListener(listener: @escaping (BandwidthData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onBandwidthUpdate", listener: listener)
  }

  func addOnBufferListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onBuffer", listener: listener)
  }

  func addOnControlsVisibleChangeListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onControlsVisibleChange", listener: listener)
  }

  func addOnEndListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onEnd", listener: listener)
  }

  func addOnErrorListener(listener: @escaping (String) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onError", listener: listener)
  }

  func addOnExternalPlaybackChangeListener(listener: @escaping (Bool) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onExternalPlaybackChange", listener: listener)
  }

  func addOnLoadListener(listener: @escaping (onLoadData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onLoad", listener: listener)
  }

  func addOnLoadStartListener(listener: @escaping (onLoadStartData) -> Void) throws -> ListenerSubscription {
    loadStartLock.lock()
    let subscription = addListener(eventName: "onLoadStart", listener: listener)
    let runningLoad = loadInProgress
    loadStartLock.unlock()

    if let runningLoad {
      listener(runningLoad)
    }
    return subscription
  }

  func addOnPlaybackStateChangeListener(listener: @escaping (onPlaybackStateChangeData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onPlaybackStateChange", listener: listener)
  }

  func addOnPlaybackRateChangeListener(listener: @escaping (Double) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onPlaybackRateChange", listener: listener)
  }

  func addOnProgressListener(listener: @escaping (onProgressData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onProgress", listener: listener)
  }

  func addOnReadyToDisplayListener(listener: @escaping () -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onReadyToDisplay", listener: listener)
  }

  func addOnSeekListener(listener: @escaping (Double) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onSeek", listener: listener)
  }

  func addOnStatusChangeListener(listener: @escaping (VideoPlayerStatus) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onStatusChange", listener: listener)
  }

  func addOnTimedMetadataListener(listener: @escaping (TimedMetadata) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onTimedMetadata", listener: listener)
  }

  func addOnTextTrackDataChangedListener(listener: @escaping ([String]) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onTextTrackDataChanged", listener: listener)
  }

  func addOnTrackChangeListener(listener: @escaping (Variant_NullType_TextTrack?) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onTrackChange", listener: listener)
  }

  func addOnVideoTrackChangeListener(listener: @escaping (VideoTrackChangeData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onVideoTrackChange", listener: listener)
  }

  func addOnAudioTrackChangeListener(listener: @escaping (AudioTrackChangeData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onAudioTrackChange", listener: listener)
  }

  func addOnVolumeChangeListener(listener: @escaping (onVolumeChangeData) -> Void) throws -> ListenerSubscription {
    addListener(eventName: "onVolumeChange", listener: listener)
  }

  func clearAllListeners() throws {
    listeners.removeAll()
    loadStartLock.lock()
    loadInProgress = nil
    loadStartLock.unlock()
  }

  // MARK: - Event emission methods

  func onAudioBecomingNoisy() {
    emitEvent(eventName: "onAudioBecomingNoisy") { (callback: () throws -> Void) in try callback() }
  }

  func onAudioFocusChange(_ hasFocus: Bool) {
    emitEvent(eventName: "onAudioFocusChange") { (callback: (Bool) throws -> Void) in try callback(hasFocus) }
  }

  func onBandwidthUpdate(_ data: BandwidthData) {
    emitEvent(eventName: "onBandwidthUpdate") { (callback: (BandwidthData) throws -> Void) in try callback(data) }
  }

  func onBuffer(_ isBuffering: Bool) {
    emitEvent(eventName: "onBuffer") { (callback: (Bool) throws -> Void) in try callback(isBuffering) }
  }

  func onControlsVisibleChange(_ isVisible: Bool) {
    emitEvent(eventName: "onControlsVisibleChange") { (callback: (Bool) throws -> Void) in try callback(isVisible) }
  }

  func onEnd() {
    emitEvent(eventName: "onEnd") { (callback: () throws -> Void) in try callback() }
  }

  func onError(_ error: String) {
    emitEvent(eventName: "onError") { (callback: (String) throws -> Void) in try callback(error) }
  }

  func onExternalPlaybackChange(_ isExternalPlaybackActive: Bool) {
    emitEvent(eventName: "onExternalPlaybackChange") { (callback: (Bool) throws -> Void) in try callback(isExternalPlaybackActive) }
  }

  func onLoad(_ data: onLoadData) {
    endLoadInProgress()
    emitEvent(eventName: "onLoad") { (callback: (onLoadData) throws -> Void) in try callback(data) }
  }

  private func endLoadInProgress() {
    loadStartLock.lock()
    loadInProgress = nil
    loadStartLock.unlock()
  }

  func onLoadStart(_ data: onLoadStartData) {
    loadStartLock.lock()
    loadInProgress = data
    let snapshot = listeners.snapshot().filter { $0.eventName == "onLoadStart" }
    loadStartLock.unlock()

    for pair in snapshot {
      if let callback = pair.callback as? (onLoadStartData) -> Void {
        callback(data)
      } else {
        print("[ReactNativeVideo] Invalid callback type for onLoadStart")
      }
    }
  }

  func onPlaybackStateChange(_ data: onPlaybackStateChangeData) {
    emitEvent(eventName: "onPlaybackStateChange") { (callback: (onPlaybackStateChangeData) throws -> Void) in try callback(data) }
  }

  func onPlaybackRateChange(_ rate: Double) {
    emitEvent(eventName: "onPlaybackRateChange") { (callback: (Double) throws -> Void) in try callback(rate) }
  }

  func onProgress(_ data: onProgressData) {
    emitEvent(eventName: "onProgress") { (callback: (onProgressData) throws -> Void) in try callback(data) }
  }

  func onReadyToDisplay() {
    emitEvent(eventName: "onReadyToDisplay") { (callback: () throws -> Void) in try callback() }
  }

  func onSeek(_ position: Double) {
    emitEvent(eventName: "onSeek") { (callback: (Double) throws -> Void) in try callback(position) }
  }

  func onStatusChange(_ status: VideoPlayerStatus) {
    // Failed or released: the load is over, later listeners are not told about it.
    // Not on .readyToPlay: iOS reports it from timeControlStatus before the item has loaded,
    // so the load ends with onLoad instead.
    if status == .error || status == .idle {
      endLoadInProgress()
    }
    emitEvent(eventName: "onStatusChange") { (callback: (VideoPlayerStatus) throws -> Void) in try callback(status) }
  }

  func onTimedMetadata(_ metadata: TimedMetadata) {
    emitEvent(eventName: "onTimedMetadata") { (callback: (TimedMetadata) throws -> Void) in try callback(metadata) }
  }

  func onTextTrackDataChanged(_ tracks: [String]) {
    emitEvent(eventName: "onTextTrackDataChanged") { (callback: ([String]) throws -> Void) in try callback(tracks) }
  }

  func onTrackChange(_ track: Variant_NullType_TextTrack?) {
    emitEvent(eventName: "onTrackChange") { (callback: (Variant_NullType_TextTrack?) throws -> Void) in try callback(track) }
  }

  func onVideoTrackChange(_ data: VideoTrackChangeData) {
    emitEvent(eventName: "onVideoTrackChange") { (callback: (VideoTrackChangeData) throws -> Void) in try callback(data) }
  }

  func onAudioTrackChange(_ data: AudioTrackChangeData) {
    emitEvent(eventName: "onAudioTrackChange") { (callback: (AudioTrackChangeData) throws -> Void) in try callback(data) }
  }

  func onVolumeChange(_ data: onVolumeChangeData) {
    emitEvent(eventName: "onVolumeChange") { (callback: (onVolumeChangeData) throws -> Void) in try callback(data) }
  }
}
