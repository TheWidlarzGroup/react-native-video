import AVFoundation
import React

@objc(RNCVideoManager)
class ReactVideoManager: RCTViewManager {
    
    override func view() -> UIView {
        return RCTVideo(eventDispatcher: bridge.eventDispatcher() as! RCTEventDispatcher)
    }
    
    func methodQueue() -> DispatchQueue {
        return bridge.uiManager.methodQueue
    }
    
    @objc(save:options:resolver:rejecter:)
    func save(_ reactTag: NSNumber, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.save(options: options, resolve: resolve, reject: reject)
            }
        })
    }
    
    @objc(seek:info:)
    func seek(_ reactTag: NSNumber, info: NSDictionary) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.seek(info)
            }
        })
    }
    
    @objc(setLicenseResult:license:)
    func setLicenseResult(_ reactTag: NSNumber, license: NSString) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResult(license as String)
            }
        })
    }
    
    @objc(setLicenseResultError:error:)
    func setLicenseResultError(_ reactTag: NSNumber, error: NSString) -> Void {
        bridge.uiManager.prependUIBlock({_ , viewRegistry in
            let view = viewRegistry?[reactTag]
            if !(view is RCTVideo) {
                RCTLogError("Invalid view returned from registry, expecting RCTVideo, got: %@", String(describing: view))
            } else if let view = view as? RCTVideo {
                view.setLicenseResultError(error as String)
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
