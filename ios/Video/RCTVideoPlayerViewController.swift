import AVKit

class RCTVideoPlayerViewController: AVPlayerViewController {
    weak var rctDelegate: RCTVideoPlayerViewControllerDelegate?

    // Optional parameters
    var preferredOrientation: String?
    var autorotate = true

    func shouldAutorotate() -> Bool {
        return autorotate || preferredOrientation?.lowercased() == "all" || preferredOrientation == nil
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)

        rctDelegate?.videoPlayerViewControllerWillDismiss(playerViewController: self)
        rctDelegate?.videoPlayerViewControllerDidDismiss(playerViewController: self)
    }

    #if !os(tvOS)

        func supportedInterfaceOrientations() -> UIInterfaceOrientationMask {
            return .all
        }

        func preferredInterfaceOrientationForPresentation() -> UIInterfaceOrientation {
            if preferredOrientation?.lowercased() == "landscape" {
                return .landscapeRight
            } else if preferredOrientation?.lowercased() == "portrait" {
                return .portrait
            } else {
                // default case
                if #available(iOS 13, tvOS 13, *) {
                    return RCTVideoUtils.getCurrentWindow()?.windowScene?.interfaceOrientation ?? .unknown
                } else {
                    #if !os(visionOS)
                        return UIApplication.shared.statusBarOrientation
                    #endif
                }
            }
        }

    #endif
}
