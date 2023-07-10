import AVKit

class RCTVideoPlayerViewController: AVPlayerViewController {
    
    weak var rctDelegate: RCTVideoPlayerViewControllerDelegate?
    
    // Optional paramters
    var preferredOrientation:String?
    var autorotate:Bool?
    
    func shouldAutorotate() -> Bool {

        if autorotate! || preferredOrientation == nil || (preferredOrientation!.lowercased() == "all") {
            return true
        }

        return false
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        
        rctDelegate?.videoPlayerViewControllerWillDismiss(playerViewController: self)
        rctDelegate?.videoPlayerViewControllerDidDismiss(playerViewController: self)
    }

    #if !TARGET_OS_TV

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
            let orientation = UIApplication.shared.statusBarOrientation
            return orientation
        }
    }
    #endif
}
