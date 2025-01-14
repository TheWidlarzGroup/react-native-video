//
//  RCTVideo+ContextualActions.swift
//  react-native-video
//
//  Created by Eduard Mazur on 14.01.2025.
//

import AVKit

@available(tvOS 15.0, *)
extension RCTVideo {
    func configureContextualActions() {
        guard let player = playerForContextualActions else {
            print("Player is not initialized.")
            return
        }

        let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

        timeObserverToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] currentTime in
            self?.updateContextualActions(currentTime: currentTime)
        }
    }

    func removeContextualActionsTimeObserver() {
        guard let player = playerForContextualActions, let token = timeObserverToken else { return }
        player.removeTimeObserver(token)
        timeObserverToken = nil
    }

    func updateContextualActions(currentTime: CMTime) {
        let currentSeconds = CMTimeGetSeconds(currentTime)

        guard let playerViewController = playerViewControllerForContextualActions else {
            return
        }
        
        for actionData in contextualActionData {
            if currentSeconds >= actionData.startAt,
               let endAt = actionData.endAt, currentSeconds < endAt {
                handleAction(actionData, playerViewController: playerViewController)
                return
            } else if currentSeconds >= actionData.startAt, actionData.endAt == nil {
                handleAction(actionData, playerViewController: playerViewController)
                return
            }
        }

        if currentContextualState != .none {
            playerViewController.contextualActions = []
            currentContextualState = .none
        }
    }

    func handleAction(_ actionData: ContextualActionData, playerViewController: AVPlayerViewController) {
        switch actionData.action {
        case "SkipIntro":
            if currentContextualState != .skipIntro {
                let skipIntroAction = UIAction(title: "Skip Intro") { [weak self] _ in
                    self?.handleSkipIntro()
                }
                playerViewController.contextualActions = [skipIntroAction]
                currentContextualState = .skipIntro
            }
        case "NextEpisode":
            if currentContextualState != .nextEpisode {
                let nextEpisodeAction = UIAction(title: "Next Episode") { [weak self] _ in
                    self?.handleNextEpisode()
                }
                playerViewController.contextualActions = [nextEpisodeAction]
                currentContextualState = .nextEpisode
            }
        default:
            break
        }
    }
    
    func handleSkipIntro() {
            onSkipIntro?(["message": "Skip Intro triggered"])
            let skipTime = CMTime(seconds: 120, preferredTimescale: 1)
            playerForContextualActions?.seek(to: skipTime, toleranceBefore: .zero, toleranceAfter: .zero)
        }

    func handleNextEpisode() {
        onNextEpisode?(["message": "Next Episode triggered"])
        print("Next episode triggered")
    }
}
