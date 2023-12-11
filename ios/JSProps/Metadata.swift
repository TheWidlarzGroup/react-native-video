//
//  Metadata.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 10.06.2021.
//

import AVDoris

struct Metadata: SuperCodable {
    let type: String
    let title: String?
    let description: String?
    let thumbnailUrl: URL
    let channelLogoUrl: String?
    let episodeInfo: String?
    let logoUrl: URL?
    let logoPosition: WatermarkPosition?
    let logoStaticDimension: WatermarkDimension?
    let logoPlayerSizeRatio: Double?
}

extension Metadata {
    enum WatermarkDimension: String, Codable {
        case width
        case height
    }

    enum WatermarkPosition: String, Codable {
        case topLeft = "TOP_LEFT"
        case topRight = "TOP_RIGHT"
        case bottomLeft = "BOTTOM_LEFT"
        case bottomRight = "BOTTOM_RIGHT"
    }
    
    var watermarkModel: WatermarkViewModel? {
        guard
            let logoUrl = logoUrl,
            let logoPosition = logoPosition,
            let logoStaticDimension = logoStaticDimension,
            let logoPlayerSizeRatio = logoPlayerSizeRatio
        else { return nil }
        
        var watermarkViewModel = WatermarkViewModel(watermarkURL: logoUrl,
                                                    watermarkPosition: AVDoris.WatermarkPosition(rawValue: logoPosition.rawValue) ?? .topRight,
                                                    watermarkStaticDimention: AVDoris.WatermarkStaticDimention(rawValue: logoStaticDimension.rawValue) ?? .height,
                                                    watermarkSuperviewRatio: logoPlayerSizeRatio)
        
        return watermarkViewModel
    }
}
