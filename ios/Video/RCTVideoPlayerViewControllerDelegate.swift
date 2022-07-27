import Foundation
import AVKit

protocol RCTVideoPlayerViewControllerDelegate : NSObject {
    func videoPlayerViewControllerWillDismiss(playerViewController:AVPlayerViewController)
    func videoPlayerViewControllerDidDismiss(playerViewController:AVPlayerViewController)
}
