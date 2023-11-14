//
//  JSTracksPolicy.swift
//  react-native-video
//
//  Created by Nick on 11/13/23.
//

import Foundation
import AVDoris


struct JSTracksPolicy: SuperCodable {
    let items: [JSTrackPolicyPair]
}

extension DorisTracksPolicy {
    init(model: JSTracksPolicy) {
        self.init(items: model.items.map { DorisTrackPolicyPair(model: $0) })
    }
}

struct JSTrackPolicyPair: SuperCodable {
    let audio: String
    let subtitle: String
}

extension DorisTrackPolicyPair {
    init(model: JSTrackPolicyPair) {
        self.init(audio: model.audio, subtitle: model.subtitle)
    }
}
