//
//  RNVJSOverlayBuilder.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 06.02.2024.
//

import AVDoris
import React
import RNDReactNativeDiceVideo

class RNVJSOverlayBuilder: OverlayBuilderProtocol {
    private let bridge: RCTBridge
    
    init(bridge: RCTBridge) {
        self.bridge = bridge
    }
    
    func buildOverlay(from config: JSOverlayConfig?, tvxManager: TvxManagerProtocol?) -> (type: OverlayType,
                                                                                          button: String?,
                                                                                          setupAction: (() -> Void)?,
                                                                                          cleanupAction: (() -> Void)?) {
        guard let config = config else { return (.none, nil, nil, nil) }
        
        switch config.type {
        case .expanded:
            guard
                let sideComponent = config.components.first(where: {$0.type == .side}),
                let bottomComponent = config.components.first(where: {$0.type == .bottom})
            else {
                return (.none, nil, nil, nil)
            }
            
            let initialSideComponentProps = ["componentId": sideComponent.initialProps?["componentId"] ?? ""]
            let initialBottomComponentProps = ["componentId": bottomComponent.initialProps?["componentId"] ?? ""]
            
            let sideJSComponentView = RCTRootView(bridge: bridge,
                                                  moduleName: sideComponent.name,
                                                  initialProperties: initialSideComponentProps)
            sideJSComponentView.backgroundColor = .clear
            
            let bottomJSComponentView = RCTRootView(bridge: bridge,
                                                    moduleName: bottomComponent.name,
                                                    initialProperties: initialBottomComponentProps)
            bottomJSComponentView.backgroundColor = .clear
            
            let overlayType = OverlayType.rightAndBottom(rightView: sideJSComponentView,
                                                         bottomView: bottomJSComponentView,
                                                         closeAction: nil)
            
            let setupAction: () -> Void = {
                sideJSComponentView.appProperties = sideComponent.initialProps
                bottomJSComponentView.appProperties = bottomComponent.initialProps
            }
            
            let cleanupAction: () -> Void = {
                sideJSComponentView.appProperties = initialSideComponentProps
                bottomJSComponentView.appProperties = initialBottomComponentProps
            }
            
            return (type: overlayType,
                    button: config.buttonIconUrl,
                    setupAction: setupAction,
                    cleanupAction: cleanupAction)
                    
        case .side:
            guard
                let sideComponent = config.components.first(where: {$0.type == .side})
            else {
                return (.none, nil, nil, nil)
            }
            let initialSideComponentProps = ["componentId": sideComponent.initialProps?["componentId"] ?? ""]

            let sideJSComponentView = RCTRootView(bridge: bridge,
                                                  moduleName: sideComponent.name,
                                                  initialProperties: initialSideComponentProps)
            sideJSComponentView.backgroundColor = .clear

            let overlayType = OverlayType.right(rightView: sideJSComponentView, closeAction: nil)
            
            let setupAction: () -> Void = {
                sideJSComponentView.appProperties = sideComponent.initialProps
            }
            
            let cleanupAction: () -> Void = {
                sideJSComponentView.appProperties = initialSideComponentProps
            }
            
            return (type: overlayType,
                    button: config.buttonIconUrl,
                    setupAction: setupAction,
                    cleanupAction: cleanupAction)
            
        default: return (.none, nil, nil, nil)
        }
    }
}
