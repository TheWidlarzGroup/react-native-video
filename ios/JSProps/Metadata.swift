//
//  Metadata.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 10.06.2021.
//

import AVDoris
import RNDReactNativeDiceVideo

struct Metadata: SuperCodable {
    let type: String
    let title: String?
    let description: String?
    let thumbnailUrl: URL
    let channelLogoUrl: String?
    let episodeInfo: String?
}
