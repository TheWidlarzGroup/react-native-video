import AVFoundation
import AVKit
import Foundation
import MediaAccessibility
import React

#if os(iOS)
    class RCTPictureInPicture: NSObject, AVPictureInPictureControllerDelegate {
        private var _onPictureInPictureStatusChanged: (() -> Void)?
        private var _onRestoreUserInterfaceForPictureInPictureStop: (() -> Void)?
        private var _restoreUserInterfaceForPIPStopCompletionHandler: ((Bool) -> Void)?
        private var _pipController: AVPictureInPictureController?
        private var _isActive = false

        init(_ onPictureInPictureStatusChanged: (() -> Void)? = nil, _ onRestoreUserInterfaceForPictureInPictureStop: (() -> Void)? = nil) {
            _onPictureInPictureStatusChanged = onPictureInPictureStatusChanged
            _onRestoreUserInterfaceForPictureInPictureStop = onRestoreUserInterfaceForPictureInPictureStop
        }

        func pictureInPictureControllerDidStartPictureInPicture(_: AVPictureInPictureController) {
            guard let _onPictureInPictureStatusChanged else { return }

            _onPictureInPictureStatusChanged()
        }

        func pictureInPictureControllerDidStopPictureInPicture(_: AVPictureInPictureController) {
            guard let _onPictureInPictureStatusChanged else { return }

            _onPictureInPictureStatusChanged()
        }

        func pictureInPictureController(
            _: AVPictureInPictureController,
            restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
        ) {
            guard let _onRestoreUserInterfaceForPictureInPictureStop else { return }

            _onRestoreUserInterfaceForPictureInPictureStop()

            _restoreUserInterfaceForPIPStopCompletionHandler = completionHandler
        }

        func setRestoreUserInterfaceForPIPStopCompletionHandler(_ restore: Bool) {
            guard let _restoreUserInterfaceForPIPStopCompletionHandler else { return }
            _restoreUserInterfaceForPIPStopCompletionHandler(restore)
            self._restoreUserInterfaceForPIPStopCompletionHandler = nil
        }

        func setupPipController(_ playerLayer: AVPlayerLayer?) {
            // Create new controller passing reference to the AVPlayerLayer
            _pipController = AVPictureInPictureController(playerLayer: playerLayer!)
            if #available(iOS 14.2, *) {
                _pipController?.canStartPictureInPictureAutomaticallyFromInline = true
            }
            _pipController?.delegate = self
        }

        func setPictureInPicture(_ isActive: Bool) {
            if _isActive == isActive {
                return
            }
            _isActive = isActive

            guard let _pipController else { return }

            if _isActive && !_pipController.isPictureInPictureActive {
                DispatchQueue.main.async {
                    _pipController.startPictureInPicture()
                }
            } else if !_isActive && _pipController.isPictureInPictureActive {
                DispatchQueue.main.async {
                    _pipController.stopPictureInPicture()
                }
            }
        }
    }
#endif
