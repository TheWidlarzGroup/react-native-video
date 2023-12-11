import AVKit
import Foundation

protocol RCTVideoPlayerViewControllerDelegate: class {
    func videoPlayerViewControllerWillDismiss(playerViewController: AVPlayerViewController)
    func videoPlayerViewControllerDidDismiss(playerViewController: AVPlayerViewController)
}
