//
//  JSDorisFactory.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 11.03.2022.
//

import AVDoris
import AVKit

class JSDorisFactory {
    static func build(jsProps: JSProps, containerView: UIView, jsInput: JSInputProtocol, bridge: RCTBridge?, tracksPolicy: JSTracksPolicy?) -> JSDoris? {
        let controller = JSDoris()
        let player = AVPlayer()
        
        var dorisPlaybackConfig = DorisPlaybackConfig()
        if let tracksPolicy = tracksPolicy {
            dorisPlaybackConfig.tracksPolicy = DorisTracksPolicy(model: tracksPolicy)
        }
        let doris = DorisFactory.create(player: player,
                                        output: controller,
                                         playerConfig: dorisPlaybackConfig)
        
        controller.doris = doris
        controller.output = jsInput
        controller.jsBridge = bridge
        
        containerView.addSubview(doris.viewController.view)
        
        doris.viewController.view.translatesAutoresizingMaskIntoConstraints = false
        
        let leading = doris.viewController.view.leadingAnchor.constraint(equalTo: containerView.leadingAnchor)
        let trailing = doris.viewController.view.trailingAnchor.constraint(equalTo: containerView.trailingAnchor)
        let top = doris.viewController.view.topAnchor.constraint(equalTo: containerView.topAnchor)
        let bottom = doris.viewController.view.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        containerView.addConstraints([leading, trailing, top, bottom])
        
        return controller
    }
}
