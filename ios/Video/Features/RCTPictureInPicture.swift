import AVFoundation
import AVKit
import MediaAccessibility
import React
import Foundation

#if TARGET_OS_IOS
class RCTPictureInPicture: NSObject, AVPictureInPictureControllerDelegate {
    private var _onPictureInPictureStatusChanged: RCTDirectEventBlock?
    private var _onRestoreUserInterfaceForPictureInPictureStop: RCTDirectEventBlock?
    private var _restoreUserInterfaceForPIPStopCompletionHandler:((Bool) -> Void)? = nil
    private var _pipController:AVPictureInPictureController?
    private var _isActive:Bool = false
    private var _eventDelegate: RCTVideoEventDelegate?
    
    init(_ onPictureInPictureStatusChanged: @escaping RCTDirectEventBlock, _ onRestoreUserInterfaceForPictureInPictureStop: @escaping RCTDirectEventBlock, _ eventDelegate: RCTVideoEventDelegate?) {
        _onPictureInPictureStatusChanged = onPictureInPictureStatusChanged
        _onRestoreUserInterfaceForPictureInPictureStop = onRestoreUserInterfaceForPictureInPictureStop
        _eventDelegate = eventDelegate
    }
    
    func pictureInPictureControllerDidStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        _eventDelegate?.onPictureInPictureStatusChanged(isActive: true)
        
        guard let _onPictureInPictureStatusChanged = _onPictureInPictureStatusChanged else { return }
        
        _onPictureInPictureStatusChanged([ "isActive": NSNumber(value: true)])
    }
    
    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        _eventDelegate?.onPictureInPictureStatusChanged(isActive: false)
        guard let _onPictureInPictureStatusChanged = _onPictureInPictureStatusChanged else { return }
        
        _onPictureInPictureStatusChanged([ "isActive": NSNumber(value: false)])
    }
    
    func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void) {
        
        assert(_restoreUserInterfaceForPIPStopCompletionHandler == nil, "restoreUserInterfaceForPIPStopCompletionHandler was not called after picture in picture was exited.")
        
        _eventDelegate?.onRestoreUserInterfaceForPictureInPictureStop()
        
        guard let _onRestoreUserInterfaceForPictureInPictureStop = _onRestoreUserInterfaceForPictureInPictureStop else { return }
        
        _onRestoreUserInterfaceForPictureInPictureStop([:])
        
        _restoreUserInterfaceForPIPStopCompletionHandler = completionHandler
    }
    
    func setRestoreUserInterfaceForPIPStopCompletionHandler(_ restore:Bool) {
        guard let _restoreUserInterfaceForPIPStopCompletionHandler = _restoreUserInterfaceForPIPStopCompletionHandler else { return }
        _restoreUserInterfaceForPIPStopCompletionHandler(restore)
        self._restoreUserInterfaceForPIPStopCompletionHandler = nil
    }
    
    func setupPipController(_ playerLayer: AVPlayerLayer?) {
        NSLog("picture in picture~~")
        guard playerLayer != nil && AVPictureInPictureController.isPictureInPictureSupported() && _isActive else { return }
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
