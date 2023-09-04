import AVFoundation
import AVKit
import MediaAccessibility
import React
import Foundation

#if os(iOS)
class RCTPictureInPicture: NSObject, AVPictureInPictureControllerDelegate {
    private var _onPictureInPictureStatusChanged: (() -> Void)? = nil
    private var _onRestoreUserInterfaceForPictureInPictureStop: (() -> Void)? = nil
    private var _restoreUserInterfaceForPIPStopCompletionHandler:((Bool) -> Void)? = nil
    private var _pipController:AVPictureInPictureController?
    private var _isActive:Bool = false
    
    init(_ onPictureInPictureStatusChanged: (() -> Void)? = nil, _ onRestoreUserInterfaceForPictureInPictureStop: (() -> Void)? = nil) {
        _onPictureInPictureStatusChanged = onPictureInPictureStatusChanged
        _onRestoreUserInterfaceForPictureInPictureStop = onRestoreUserInterfaceForPictureInPictureStop
    }
    
    func pictureInPictureControllerDidStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        guard let _onPictureInPictureStatusChanged = _onPictureInPictureStatusChanged else { return }
        
        _onPictureInPictureStatusChanged()
    }
    
    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        guard let _onPictureInPictureStatusChanged = _onPictureInPictureStatusChanged else { return }
        
        _onPictureInPictureStatusChanged()
    }
    
    func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void) {

        guard let _onRestoreUserInterfaceForPictureInPictureStop = _onRestoreUserInterfaceForPictureInPictureStop else { return }
        
        _onRestoreUserInterfaceForPictureInPictureStop()
        
        _restoreUserInterfaceForPIPStopCompletionHandler = completionHandler
    }
    
    func setRestoreUserInterfaceForPIPStopCompletionHandler(_ restore:Bool) {
        guard let _restoreUserInterfaceForPIPStopCompletionHandler = _restoreUserInterfaceForPIPStopCompletionHandler else { return }
        _restoreUserInterfaceForPIPStopCompletionHandler(restore)
        self._restoreUserInterfaceForPIPStopCompletionHandler = nil
    }
    
    func setupPipController(_ playerLayer: AVPlayerLayer?) {
        // Create new controller passing reference to the AVPlayerLayer
        _pipController = AVPictureInPictureController(playerLayer:playerLayer!)
        _pipController?.delegate = self
    }
    
    func setPictureInPicture(_ isActive:Bool) {
        if _isActive == isActive {
            return
        }
        _isActive = isActive
        
        guard let _pipController = _pipController else { return }
        
        if _isActive && !_pipController.isPictureInPictureActive {
            DispatchQueue.main.async(execute: {
                _pipController.startPictureInPicture()
            })
        } else if !_isActive && _pipController.isPictureInPictureActive {
            DispatchQueue.main.async(execute: {
                _pipController.stopPictureInPicture()
            })
        }
    }
}
#endif
