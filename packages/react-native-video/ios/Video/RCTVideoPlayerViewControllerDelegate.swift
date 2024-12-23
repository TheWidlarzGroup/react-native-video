import AVKit
import Foundation

protocol RCTVideoPlayerViewControllerDelegate: AnyObject {
    func videoPlayerViewControllerWillDismiss(playerViewController: AVPlayerViewController)
    func videoPlayerViewControllerDidDismiss(playerViewController: AVPlayerViewController)
}
