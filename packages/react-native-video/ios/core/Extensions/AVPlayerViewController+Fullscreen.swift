//
//  AVPlayerViewController+Fullscreen.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/04/2025.
//

import Foundation
import AVKit

extension AVPlayerViewController {
  // https://stackoverflow.com/a/64466924
  
  func enterFullscreen(animated: Bool) {
    performIfResponds(NSSelectorFromString("enterFullScreenAnimated:completionHandler:"), with: animated, with: nil)
  }
  
  func exitFullscreen(animated: Bool) {
    performIfResponds(NSSelectorFromString("exitFullScreenAnimated:completionHandler:"), with: animated, with: nil)
  }
}
