//
//  VideoManager.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/04/2025.
//

import Foundation
import AVFoundation

class VideoManager {
  // MARK: - Singleton
  static let shared = VideoManager()
  
  private var players = NSHashTable<HybridVideoPlayer>.weakObjects()
  private var videoView = NSHashTable<VideoComponentView>.weakObjects()
  
  private var isAudioSessionActive = false
  private var remoteControlEventsActive = false
  
  // TODO: Create Global Config, and expose it there
  private var isAudioSessionManagementDisabled: Bool = false
  
  private init() {
    // Subscribe to audio interruption notifications
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionInterruption),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    
    // Subscribe to route change notifications
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioRouteChange),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  // MARK: - public
  
  func register(player: HybridVideoPlayer) {
    players.add(player)
  }
  
  func unregister(player: HybridVideoPlayer) {
    players.remove(player)
  }
  
  func register(view: VideoComponentView) {
    videoView.add(view)
  }
  
  func unregister(view: VideoComponentView) {
    videoView.remove(view)
  }
  
  func requestAudioSessionUpdate() {
    updateAudioSessionConfiguration()
  }
  
  // MARK: - Audio Session Management
  private func activateAudioSession() {
    if isAudioSessionActive {
      return
    }
    
    do {
      try AVAudioSession.sharedInstance().setActive(true)
      isAudioSessionActive = true
    } catch {
      print("Failed to activate audio session: \(error.localizedDescription)")
    }
  }
  
  private func deactivateAudioSession() {
    if !isAudioSessionActive {
      return
    }
    
    do {
      try AVAudioSession.sharedInstance().setActive(
        false, options: .notifyOthersOnDeactivation
      )
      isAudioSessionActive = false
    } catch {
      print("Failed to deactivate audio session: \(error.localizedDescription)")
    }
  }
  
  private func updateAudioSessionConfiguration() {
    let isAnyPlayerPlaying = players.allObjects.contains { hybridPlayer in
      hybridPlayer.player?.isMuted == false && hybridPlayer.player?.rate != 0
    }
    
    if isAnyPlayerPlaying {
      activateAudioSession()
    } else {
      deactivateAudioSession()
    }
    
    configureAudioSession()
  }
  
  private func configureAudioSession() {
    let audioSession = AVAudioSession.sharedInstance()
    
    let anyViewNeedsPictureInPicture = videoView.allObjects.contains { view in
      view.allowsPictureInPicturePlayback
    }
    
    if isAudioSessionManagementDisabled {
      return
    }
    
    let category: AVAudioSession.Category = determineAudioCategory(
      silentSwitchObey: false, // TODO: Pass actual value after we add prop
      silentSwitchIgnore: false, // TODO: Pass actual value after we add prop
      earpiece: false, // TODO: Pass actual value after we add prop
      pip: anyViewNeedsPictureInPicture,
      backgroundPlayback: false, // TODO: Pass actual value after we add prop
      notificationControls: false // TODO: Pass actual value after we add prop
    )
    
    do {
      try audioSession.setCategory(category)
    } catch {
      print("ReactNativeVideo: Failed to set audio session category: \(error.localizedDescription)")
    }
  }
  
  private func determineAudioCategory(
    silentSwitchObey: Bool,
    silentSwitchIgnore: Bool,
    earpiece: Bool,
    pip: Bool,
    backgroundPlayback: Bool,
    notificationControls: Bool
  ) -> AVAudioSession.Category {
    // Handle conflicting settings
    if silentSwitchObey && silentSwitchIgnore {
      print(
        "Warning: Conflicting ignoreSilentSwitch settings found (obey vs ignore) - defaulting to ignore"
      )
      return .playback
    }
    
    // PiP, background playback, or notification controls require playback category
    if pip || backgroundPlayback || notificationControls || remoteControlEventsActive {
      if silentSwitchObey {
        print(
          "Warning: ignoreSilentSwitch=obey cannot be used with PiP, backgroundPlayback, or notification controls - using playback category"
        )
      }
      
      if earpiece {
        print(
          "Warning: audioOutput=earpiece cannot be used with PiP, backgroundPlayback, or notification controls - using playback category"
        )
      }
      
      return .playback
    }
    
    // Earpiece requires playAndRecord
    if earpiece {
      if silentSwitchObey {
        print(
          "Warning: audioOutput=earpiece cannot be used with ignoreSilentSwitch=obey - using playAndRecord category"
        )
      }
      return .playAndRecord
    }
    
    // Honor silent switch if requested
    if silentSwitchObey {
      return .ambient
    }
    
    // Default to playback for most cases
    return .playback
  }
  
  
  // MARK: - Notification Handlers
  
  @objc
  private func handleAudioSessionInterruption(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue)
    else {
      return
    }
    
    switch type {
    case .began:
      // Audio session interrupted, nothing to do as players will pause automatically
      break
      
    case .ended:
      // Interruption ended, check if we should resume audio session
      if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
        if options.contains(.shouldResume) {
          updateAudioSessionConfiguration()
        }
      }
      
    @unknown default:
      break
    }
  }
  
  @objc
  private func handleAudioRouteChange(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
    else {
      return
    }
    
    switch reason {
    case .categoryChange, .override, .wakeFromSleep, .newDeviceAvailable, .oldDeviceUnavailable:
      // Reconfigure audio session when route changes
      updateAudioSessionConfiguration()
    default:
      break
    }
  }
}
