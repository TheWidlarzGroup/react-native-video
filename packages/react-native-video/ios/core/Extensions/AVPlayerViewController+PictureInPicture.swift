//
//  AVPlayerViewController+PictureInPicture.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/04/2025.
//

import Foundation
import AVKit

extension AVPlayerViewController {
  // https://github.com/expo/expo/blob/d37ae17df23c58011a3c5b9f5dedd563bf8e6521/packages/expo-video/ios/VideoView.swift#L110
  func startPictureInPicture() throws {
    guard AVPictureInPictureController.isPictureInPictureSupported() else {
      throw VideoViewError.pictureInPictureNotSupported.error()
    }
    
    performIfResponds(NSSelectorFromString("startPictureInPicture"))
  }
  
  func stopPictureInPicture() {
    performIfResponds(NSSelectorFromString("stopPictureInPicture"))
  }
}
