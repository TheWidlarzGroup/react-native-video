//
//  WatermarkMetadata.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 27.02.2024.
//

import AVDoris
import RNDReactNativeDiceVideo

struct WatermarkMetadata: SuperCodable {
    let logoUrl: URL?
    let logoPosition: WatermarkPosition?
    let logoStaticDimension: WatermarkDimension?
    let logoPlayerSizeRatio: Double?
    
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

extension JSMetadata {
    init(metadata: WatermarkMetadata?) {
        self.init(logoUrl: metadata?.logoUrl,
                  logoStaticDimension: .init(dimention: metadata?.logoStaticDimension),
                  logoPlayerSizeRatio: metadata?.logoPlayerSizeRatio,
                  logoPosition: .init(position: metadata?.logoPosition))
    }
}

private extension JSMetadata.JSWatermarkDimension {
    init?(dimention: WatermarkMetadata.WatermarkDimension?) {
        switch dimention {
        case .width: self = .width
        case .height: self = .height
        default: return nil
        }
    }
}

private extension JSMetadata.JSWatermarkPosition {
    init?(position: WatermarkMetadata.WatermarkPosition?) {
        switch position {
        case .topLeft: self = .topLeft
        case .topRight: self = .topRight
        case .bottomLeft: self = .bottomLeft
        case .bottomRight: self = .bottomRight
        default: return nil
        }
    }
}
