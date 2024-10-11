import AVFoundation
import React

@objc(RCTVideoManager)
class RCTVideoManager: RCTViewManager {
    override func view() -> UIView {
        return RCTVideo(eventDispatcher: (RCTBridge.current().eventDispatcher() as! RCTEventDispatcher))
    }

    func methodQueue() -> DispatchQueue {
        return bridge.uiManager.methodQueue
    }

    func performOnVideoView(withReactTag reactTag: NSNumber, callback: @escaping (RCTVideo?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                callback(nil)
                return
            }

            let view = self.bridge.uiManager.view(forReactTag: reactTag)

            guard let videoView = view as? RCTVideo else {
                DebugLog("Invalid view returned from registry, expecting RCTVideo, got: \(String(describing: self.view))")
                callback(nil)
                return
            }

            callback(videoView)
        }
    }

    @objc(seekCmd:time:tolerance:)
    func seekCmd(_ reactTag: NSNumber, time: NSNumber, tolerance: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setSeek(time, tolerance)
        })
    }

    @objc(setLicenseResultCmd:license:licenseUrl:)
    func setLicenseResultCmd(_ reactTag: NSNumber, license: NSString, licenseUrl: NSString) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResult(license as String, licenseUrl as String)
        })
    }

    @objc(setLicenseResultErrorCmd:error:licenseUrl:)
    func setLicenseResultErrorCmd(_ reactTag: NSNumber, error: NSString, licenseUrl: NSString) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResultError(error as String, licenseUrl as String)
        })
    }

    @objc(setPlayerPauseStateCmd:paused:)
    func setPlayerPauseStateCmd(_ reactTag: NSNumber, paused: Bool) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setPaused(paused)
        })
    }

    @objc(setVolumeCmd:volume:)
    func setVolumeCmd(_ reactTag: NSNumber, volume: Float) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setVolume(volume)
        })
    }

    @objc(setFullScreenCmd:fullscreen:)
    func setFullScreenCmd(_ reactTag: NSNumber, fullScreen: Bool) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setFullscreen(fullScreen)
        })
    }

    @objc(enterPictureInPictureCmd:)
    func enterPictureInPictureCmd(_ reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.enterPictureInPicture()
        })
    }

    @objc(exitPictureInPictureCmd:)
    func exitPictureInPictureCmd(_ reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.exitPictureInPicture()
        })
    }

    @objc(setSourceCmd:source:)
    func setSourceCmd(_ reactTag: NSNumber, source: NSDictionary) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setSrc(source)
        })
    }

    @objc(save:options:resolve:reject:)
    func save(_ reactTag: NSNumber, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.save(options, resolve, reject)
        })
    }

    @objc(getCurrentPosition:resolve:reject:)
    func getCurrentPosition(_ reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.getCurrentPlaybackTime(resolve, reject)
        })
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
