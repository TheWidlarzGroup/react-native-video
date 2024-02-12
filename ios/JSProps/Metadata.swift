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
        
        let watermarkViewModel = WatermarkViewModel(watermarkURL: logoUrl,
                                                    watermarkPosition: AVDoris.WatermarkPosition(rawValue: logoPosition.rawValue) ?? .topRight,
                                                    watermarkStaticDimention: AVDoris.WatermarkStaticDimention(rawValue: logoStaticDimension.rawValue) ?? .height,
                                                    watermarkSuperviewRatio: logoPlayerSizeRatio)
        
        return watermarkViewModel
    }
}

extension JSMetadata.JSWatermarkDimension {
    init?(dimention: Metadata.WatermarkDimension?) {
        switch dimention {
        case .width: self = .width
        case .height: self = .height
        default: return nil
        }
    }
}

extension JSMetadata.JSWatermarkPosition {
    init?(position: Metadata.WatermarkPosition?) {
        switch position {
        case .topLeft: self = .topLeft
        case .topRight: self = .topRight
        case .bottomLeft: self = .bottomLeft
        case .bottomRight: self = .bottomRight
        default: return nil
        }
    }
}
