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
    func save(options: NSDictionary, reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock,reject: @escaping RCTPromiseRejectBlock) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.save(options: options, resolve: resolve, reject: reject)
            }
        })
    }
    
    @objc(setLicenseResult:licenseUrl:reactTag:)
    func setLicenseResult(license: NSString, licenseUrl:NSString, reactTag: NSNumber) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResult(license as String, licenseUrl as String)
            }
        })
    }
    
    @objc(setLicenseResultError:licenseUrl:reactTag:)
    func setLicenseResultError(error: NSString, licenseUrl:NSString, reactTag: NSNumber) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResultError(error as String, licenseUrl as String)
            }
        })
    }
    
    @objc(dismissFullscreenPlayer:reactTag:)
    func dismissFullscreenPlayer(error: NSString, reactTag: NSNumber) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.dismissFullscreenPlayer(error as String)
            }
        })
    }
    @objc(presentFullscreenPlayer:reactTag:)
    func presentFullscreenPlayer(error: NSString, reactTag: NSNumber) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.presentFullscreenPlayer(error as String)
            }
        })
    }

    override func constantsToExport() -> [AnyHashable : Any]? {
        return [
            "ScaleNone": AVLayerVideoGravity.resizeAspect,
            "ScaleToFill": AVLayerVideoGravity.resize,
            "ScaleAspectFit": AVLayerVideoGravity.resizeAspect,
            "ScaleAspectFill": AVLayerVideoGravity.resizeAspectFill
        ]
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
