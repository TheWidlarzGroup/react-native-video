//
//  OverlayConfig.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 11.03.2022.
//

import AVDoris

struct OverlayConfig: SuperCodable {
    let type: OverlayConfigType
    let button: String
    let components: [Component]
    
    enum OverlayConfigType: String, Codable {
        case expanded, side, bottom, full
    }
    
    struct Component: Codable {
        let name: String
        let type: OverlayConfigType
        let initialProps: Dictionary<String, String>?
    }
    
    func create(bridge: RCTBridge?) -> OverlayType {
        guard let bridge = bridge else { return .none }
        
        switch type {
        case .expanded:
            guard
                let sideComponent = components.first(where: {$0.type == .side}),
                let bottomComponent = components.first(where: {$0.type == .bottom})
            else {
                return .none
            }
            
            let sideJSComponentView = RCTRootView(bridge: bridge,
                                                  moduleName: sideComponent.name,
                                                  initialProperties: sideComponent.initialProps)
            
            let bottomJSComponentView = RCTRootView(bridge: bridge,
                                                    moduleName: bottomComponent.name,
                                                    initialProperties: bottomComponent.initialProps)
            return .rightAndBottom(rightView: sideJSComponentView,
                                   bottomView: bottomJSComponentView,
                                   closeAction: nil)
        case .side:
            guard
                let sideComponent = components.first(where: {$0.type == .side})
            else {
                return .none
            }
            
            let sideJSComponentView = RCTRootView(bridge: bridge,
                                                  moduleName: sideComponent.name,
                                                  initialProperties: sideComponent.initialProps)
            return .right(rightView: sideJSComponentView,
                          closeAction: nil)
        default: return .none
        }
    }
}
