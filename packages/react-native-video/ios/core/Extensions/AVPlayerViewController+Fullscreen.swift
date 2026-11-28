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

  /// Calls the selector through its IMP so that `animated` arrives as a real BOOL (through
  /// `perform(_:with:with:)` it arrives as an object pointer, which is always true) and so that
  /// `completion` runs when the dismissal has finished.
  func exitFullscreen(animated: Bool, completion: @escaping () -> Void) {
    let selector = NSSelectorFromString("exitFullScreenAnimated:completionHandler:")
    guard responds(to: selector) else {
      completion()
      return
    }
    typealias ExitFullscreen = @convention(c) (
      AnyObject, Selector, Bool, @escaping @convention(block) (Bool) -> Void
    ) -> Void
    let exit = unsafeBitCast(method(for: selector), to: ExitFullscreen.self)
    exit(self, selector, animated) { _ in completion() }
  }
}
