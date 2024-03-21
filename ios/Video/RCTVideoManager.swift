import AVFoundation
import React

@objc(RCTVideoManager)
class RCTVideoManager: RCTViewManager {
    override func view() -> UIView {
        return RCTVideo(eventDispatcher: bridge.eventDispatcher() as! RCTEventDispatcher)
    }

    func methodQueue() -> DispatchQueue {
        return bridge.uiManager.methodQueue
    }

    @objc(save:reactTag:resolver:rejecter:)
    func save(options: NSDictionary, reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.save(options: options, resolve: resolve, reject: reject)
            }
        }
    }

    @objc(setLicenseResult:licenseUrl:reactTag:)
    func setLicenseResult(license: NSString, licenseUrl: NSString, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResult(license as String, licenseUrl as String)
            }
        }
    }

    @objc(setLicenseResultError:licenseUrl:reactTag:)
    func setLicenseResultError(error: NSString, licenseUrl: NSString, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResultError(error as String, licenseUrl as String)
            }
        }
    }

    @objc(dismissFullscreenPlayer:)
    func dismissFullscreenPlayer(_ reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.dismissFullscreenPlayer()
            }
        }
    }

    @objc(presentFullscreenPlayer:)
    func presentFullscreenPlayer(_ reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.presentFullscreenPlayer()
            }
        }
    }

    @objc(setPlayerPauseState:reactTag:)
    func setPlayerPauseState(paused: NSNumber, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                let paused = paused.boolValue
                view.setPaused(paused)
            }
        }
    }
    
    @objc(getCurrentPlaybackTime:resolver:rejecter:)
    func getCurrentPlaybackTime(reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, _reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.getCurrentPlaybackTime(resolve)
            }
        }
    }

    @objc(getCurrentPlaybackRate:resolver:rejecter:)
    func getCurrentPlaybackRate(reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, _reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.getCurrentPlaybackRate(resolve)
            }
        }
    }
    
    @objc(setPlaybackRate:reactTag:)
    func setPlaybackRate(rate: Float, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setRate(rate)
            }
        }
    }
    
    @objc(checkIfLivestream:resolver:rejecter:)
    func checkIfLivestream(reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, _reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.checkIfLivestream(resolve)
            }
        }
    }
    
    @objc(setVolume:forceUnmute:reactTag:)
    func setVolume(volume: Float, forceUnmute: NSNumber, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                let forceUnmute = forceUnmute.boolValue
                view.setVolume(volume, forceUnmute)
            }
        }
    }
    
    @objc(setMuted:reactTag:)
    func setMuted(muted: NSNumber, reactTag: NSNumber) {
        bridge.uiManager.prependUIBlock { _, viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                let muted = muted.boolValue
                view.setMuted(muted)
            }
        }
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
