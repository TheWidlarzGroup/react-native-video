//
//  JSNowPlaying.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 12.06.2023.
//

import Foundation

struct JSNowPlaying: SuperCodable {
    let title: String?
    let channelLogoUrl: URL?
    let startDate: Double?
    let endDate: Double?
    let dateFormat: String?
}
