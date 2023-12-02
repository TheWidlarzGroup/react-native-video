import AVKit
import Foundation

protocol RCTVideoPlayerViewControllerDelegate: NSObject {
  func videoPlayerViewControllerWillDismiss(playerViewController: AVPlayerViewController)
  func videoPlayerViewControllerDidDismiss(playerViewController: AVPlayerViewController)
}
