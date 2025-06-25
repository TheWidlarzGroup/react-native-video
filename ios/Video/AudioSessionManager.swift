import AVFoundation
import Foundation

class AudioSessionManager {
    static let shared = AudioSessionManager()

    private var videoViews = NSHashTable<RCTVideo>.weakObjects()
    private var isAudioSessionActive = false
    private var remoteControlEventsActive = false

    private var isAudioSessionManagementDisabled: Bool {
        return videoViews.allObjects.contains { view in
            return view._disableAudioSessionManagement == true
        }
    }

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

    // MARK: - Public API

    func registerView(view: RCTVideo) {
        if videoViews.contains(view) {
            return
        }

        videoViews.add(view)
        updateAudioSessionConfiguration()
    }

    func unregisterView(view: RCTVideo) {
        if !videoViews.contains(view) {
            return
        }

        videoViews.remove(view)
        updateAudioSessionConfiguration()

        if videoViews.allObjects.isEmpty && !remoteControlEventsActive {
            deactivateAudioSession()
        }
    }

    func updateAudioSessionConfiguration() {
        // Activate audio session if needed
        let isAnyPlayerPlaying = videoViews.allObjects.contains { view in
            return !view.isMuted() && view._player != nil && view._player?.rate != 0
        }

        if isAnyPlayerPlaying || remoteControlEventsActive {
            activateAudioSession()
        }

        configureAudioSession()
    }

    // Handle remote control events from NowPlayingInfoCenterManager
    func setRemoteControlEventsActive(_ active: Bool) {
        if isAudioSessionManagementDisabled {
            // AUDIO SESSION MANAGEMENT DISABLED BY USER
            return
        }

        remoteControlEventsActive = active

        if active {
            // Force playback category and activate session when remote control events are active
            configureForRemoteControlEvents()
        } else {
            // If no active players, we can deactivate the session
            if !videoViews.allObjects.contains(where: { view in
                return view._player != nil && view._player?.rate != 0
            }) {
                deactivateAudioSession()
            } else {
                // Otherwise reconfigure based on current players
                updateAudioSessionConfiguration()
            }
        }
    }

    // Notification that a player's properties have changed
    func playerPropertiesChanged(view: RCTVideo) {
        // Only update if this is a registered view
        if videoViews.contains(view) {
            updateAudioSessionConfiguration()
        }
    }

    // MARK: - Audio Session Configuration

    private func configureForRemoteControlEvents() {
        let audioSession = AVAudioSession.sharedInstance()

        do {
            // Remote control events always need playback category
            try audioSession.setCategory(.playback, mode: .moviePlayback)
            activateAudioSession()
        } catch {
            print(
                "Failed to configure audio session for remote control events: \(error.localizedDescription)"
            )
        }
    }

    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        var options: AVAudioSession.CategoryOptions = []

        // Check player properties
        let anyPlayerShowNotificationControls = videoViews.allObjects.contains { view in
            return view._showNotificationControls
        }

        let anyPlayerNeedsPiP = videoViews.allObjects.contains { view in
            return view.isPictureInPictureActive()
        }

        let anyPlayerNeedsBackgroundPlayback = videoViews.allObjects.contains { view in
            return view._playInBackground
        }

        let anyPlayerPlaying = videoViews.allObjects.contains { view in
            return !view.isMuted() && view._player != nil && view._player?.rate != 0
        }

        let anyPlayerWantsMixing = videoViews.allObjects.contains { view in
            return view._mixWithOthers == "mix" || view._mixWithOthers == "duck"
        }

        let canAllowMixing = anyPlayerWantsMixing || (!anyPlayerShowNotificationControls && !anyPlayerNeedsBackgroundPlayback)

        if isAudioSessionManagementDisabled {
            // AUDIO SESSION MANAGEMENT DISABLED BY USER
            return
        }

        if !anyPlayerPlaying {
            options.insert(.mixWithOthers)
        } else if canAllowMixing {
            let shouldEnableMixing = videoViews.allObjects.contains { view in
                return view._mixWithOthers == "mix"
            }

            let shouldEnableDucking = videoViews.allObjects.contains { view in
                return view._mixWithOthers == "duck"
            }

            if shouldEnableMixing && shouldEnableDucking {
                print(
                    "Warning: Conflicting mixWithOthers settings found (mix vs duck) - defaulting to mix"
                )
                options.insert(.mixWithOthers)
            } else {
                if shouldEnableMixing {
                    options.insert(.mixWithOthers)
                }

                if shouldEnableDucking {
                    options.insert(.duckOthers)
                }
            }
        }

        let isAnyPlayerUsingEarpiece = videoViews.allObjects.contains { view in
            return view._audioOutput == "earpiece"
        }

        let isSilentSwitchIgnore = videoViews.allObjects.contains { view in
            return view._ignoreSilentSwitch == "ignore"
        }

        let isSilentSwitchObey = videoViews.allObjects.contains { view in
            return view._ignoreSilentSwitch == "obey"
        }

        // Determine audio category based on player requirements
        let category = determineAudioCategory(
            silentSwitchObey: isSilentSwitchObey,
            silentSwitchIgnore: isSilentSwitchIgnore,
            earpiece: isAnyPlayerUsingEarpiece,
            pip: anyPlayerNeedsPiP,
            backgroundPlayback: anyPlayerNeedsBackgroundPlayback,
            notificationControls: anyPlayerShowNotificationControls
        )

        do {
            try audioSession.setCategory(
                category, mode: .moviePlayback, options: options
            )

            // Configure audio port
            if isAnyPlayerUsingEarpiece, audioSession.category == .playAndRecord {
                #if os(iOS) || os(visionOS)
                    try audioSession.overrideOutputAudioPort(.speaker)
                #endif
            } else {
                try audioSession.overrideOutputAudioPort(.none)
            }
        } catch {
            print("Failed to configure audio session: \(error.localizedDescription)")
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
