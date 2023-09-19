/*
See LICENSE folder for this sample’s licensing information.

Abstract:
The `AssetListManager` class is an `NSObject` subclass that is responsible for
 providing a list of assets to present in the `AssetListTableViewController`.
*/

import Foundation
import AVFoundation

/// - Tag: AssetListManager
class AssetListManager: NSObject {
    
    // MARK: Properties
    
    /// A singleton instance of `AssetListManager`.
    static let sharedManager = AssetListManager()
    
    /// The internal array of Asset structs.
    private var assets = [Asset]()
    
    // MARK: Initialization
    
    override private init() {
        super.init()
        
        /*
         Do not setup the AssetListManager.assets until AssetPersistenceManager has
         finished restoring.  This prevents race conditions where the `AssetListManager`
         creates a list of `Asset`s that doesn't reuse already existing `AVURLAssets`
         from existng `AVAssetDownloadTasks.
         */
        let notificationCenter = NotificationCenter.default
        notificationCenter.addObserver(self, selector: #selector(handleAssetPersistenceManagerDidRestoreState(_:)),
                                       name: .AssetPersistenceManagerDidRestoreState, object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: .AssetPersistenceManagerDidRestoreState, object: nil)
    }
    
    // MARK: Asset access
    
    /// Returns the number of Assets.
    func numberOfAssets() -> Int {
        return assets.count
    }
    
    /// Returns an Asset for a given IndexPath.
    func asset(at index: Int) -> Asset {
        return assets[index]
    }
    
    @objc
    func handleAssetPersistenceManagerDidRestoreState(_ notification: Notification) {
        DispatchQueue.main.async {
            
            // Iterate over each dictionary in the array.
            for stream in StreamListManager.shared.streams {
                
                // To ensure that we are reusing AVURLAssets we first find out if there is one available for an already active download.
                if let asset = AssetPersistenceManager.sharedManager.assetForStream(withName: stream.name) {
                    self.assets.append(asset)
                } else {
                    /*
                     If an existing `AVURLAsset` is not available for an active
                     download we then see if there is a file URL available to
                     create an asset from.
                     */
                    if let asset = AssetPersistenceManager.sharedManager.localAssetForStream(withName: stream.name) {
                        self.assets.append(asset)
                    } else {
                        let urlAsset = AVURLAsset(url: URL(string: stream.playlistURL)!)
                        
                        let asset = Asset(stream: stream, urlAsset: urlAsset)
                        
                        self.assets.append(asset)
                    }
                }
            }
            
            NotificationCenter.default.post(name: .AssetListManagerDidLoad, object: self)
        }
    }
}

extension Notification.Name {
    
    /// Notification for when download progress has changed.
    static let AssetListManagerDidLoad = Notification.Name(rawValue: "AssetListManagerDidLoadNotification")
}
