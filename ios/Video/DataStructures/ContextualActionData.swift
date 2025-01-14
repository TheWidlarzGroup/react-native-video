//
//  ContextualActionData.swift
//  react-native-video
//
//  Created by Eduard Mazur on 14.01.2025.
//

import Foundation

struct ContextualActionData {
    let action: String
    let startAt: Double
    let endAt: Double?
}

public enum ContextualButtonState {
    case none
    case skipIntro
    case nextEpisode
}
