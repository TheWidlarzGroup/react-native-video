/*
See LICENSE folder for this sample’s licensing information.

Abstract:
`AssetPlaybackManager` is the class that manages the playback of Assets in this
 sample using Key-value observing on various AVFoundation classes.
*/

import UIKit
import AVFoundation

/// - Tag: AssetPlaybackManager
class AssetPlaybackManager: NSObject {
    
    // MARK: Properties
    
    /// Singleton for AssetPlaybackManager.
    static let sharedManager = AssetPlaybackManager()
    
    weak var delegate: AssetPlaybackDelegate?
    
    /// The instance of AVPlayer that will be used for playback of AssetPlaybackManager.playerItem.
    private let player = AVPlayer()
    
    /// A Bool tracking if the AVPlayerItem.status has changed to .readyToPlay for the current AssetPlaybackManager.playerItem.
    private var readyForPlayback = false
    
    /// The `NSKeyValueObservation` for the KVO on \AVPlayerItem.status.
    private var playerItemObserver: NSKeyValueObservation?
    
    /// The `NSKeyValueObservation` for the KVO on \AVURLAsset.isPlayable.
    private var urlAssetObserver: NSKeyValueObservation?
    
    /// The `NSKeyValueObservation` for the KVO on \AVPlayer.currentItem.
    private var playerObserver: NSKeyValueObservation?
    
    private var perfMeasurements: PerfMeasurements?
    
    /// The AVPlayerItem associated with AssetPlaybackManager.asset.urlAsset
    private var playerItem: AVPlayerItem? {
        willSet {
            /// Remove any previous KVO observer.
            guard let playerItemObserver = playerItemObserver else { return }
            
            playerItemObserver.invalidate()
            
            let notificationCenter = NotificationCenter.default
            notificationCenter.removeObserver(self, name: .TimebaseEffectiveRateChangedNotification, object: playerItem?.timebase)
            notificationCenter.removeObserver(self, name: .AVPlayerItemPlaybackStalled, object: playerItem)
            
            perfMeasurements?.playbackEnded()
        }
        
        didSet {
            /// - Tag: PlayerItemReadyToPlay
            playerItemObserver = playerItem?.observe(\AVPlayerItem.status, options: [.new, .initial]) { [weak self] (item, _) in
                guard let strongSelf = self else { return }
                
                if item.status == .readyToPlay {
                    if !strongSelf.readyForPlayback {
                        strongSelf.readyForPlayback = true
                        strongSelf.delegate?.streamPlaybackManager(strongSelf, playerReadyToPlay: strongSelf.player)
                    }
                } else if item.status == .failed {
                    let error = item.error
                    
                    print("Error: \(String(describing: error?.localizedDescription))")
                }
            }
            
            if playerItem != nil {
                perfMeasurements = PerfMeasurements(playerItem: playerItem!)
                let notificationCenter = NotificationCenter.default
                notificationCenter.addObserver(self,
                                               selector: #selector(handleTimebaseRateChanged(_:)),
                                               name: .TimebaseEffectiveRateChangedNotification, object: playerItem?.timebase)
                notificationCenter.addObserver(self,
                                               selector: #selector(handlePlaybackStalled(_:)), name: .AVPlayerItemPlaybackStalled, object: playerItem)
            }
        }
    }

    /// The Asset that is currently being loaded for playback.
    /// - Tag: PlayStreamCreatePlayerItem
    private var asset: Asset? {
        willSet {
            /// Remove any previous KVO observer.
            guard let urlAssetObserver = urlAssetObserver else { return }
            
            urlAssetObserver.invalidate()
        }
        
        didSet {
            if let asset = asset {
                urlAssetObserver = asset.urlAsset.observe(\AVURLAsset.isPlayable, options: [.new, .initial]) { [weak self] (urlAsset, _) in
                    guard let strongSelf = self, urlAsset.isPlayable == true else { return }
                    
                    strongSelf.playerItem = AVPlayerItem(asset: urlAsset)
                    strongSelf.player.replaceCurrentItem(with: strongSelf.playerItem)
                }
            } else {
                playerItem = nil
                player.replaceCurrentItem(with: nil)
                readyForPlayback = false
            }
        }
    }
    
    // MARK: Intitialization
    
    override private init() {
        super.init()
        playerObserver = player.observe(\AVPlayer.currentItem, options: [.new]) { [weak self] (player, _) in
            guard let strongSelf = self else { return }
            
            strongSelf.delegate?.streamPlaybackManager(strongSelf, playerCurrentItemDidChange: player)
        }
        
        player.usesExternalPlaybackWhileExternalScreenIsActive = true
    }
    
    deinit {
        /// Remove any KVO observer.
        playerObserver?.invalidate()
    }
    
    /**
     Replaces the currently playing `Asset`, if any, with a new `Asset`. If nil
     is passed, `AssetPlaybackManager` will handle unloading the existing `Asset`
     and handle KVO cleanup.
     */
    func setAssetForPlayback(_ asset: Asset?) {
        self.asset = asset
    }
    
    @objc
    func handleTimebaseRateChanged(_ notification: Notification) {
        if CMTimebaseGetTypeID() == CFGetTypeID(notification.object as CFTypeRef) {
            let timebase = notification.object as! CMTimebase
            let rate: Double = CMTimebaseGetRate(timebase)
            perfMeasurements?.rateChanged(rate: rate)
        }
    }

    @objc
    func handlePlaybackStalled(_ notification: Notification) {
       perfMeasurements?.playbackStalled()
    }
}

/// AssetPlaybackDelegate provides a common interface for AssetPlaybackManager to provide callbacks to its delegate.
protocol AssetPlaybackDelegate: class {
    
    /// This is called when the internal AVPlayer in AssetPlaybackManager is ready to start playback.
    func streamPlaybackManager(_ streamPlaybackManager: AssetPlaybackManager, playerReadyToPlay player: AVPlayer)
    
    /// This is called when the internal AVPlayer's currentItem has changed.
    func streamPlaybackManager(_ streamPlaybackManager: AssetPlaybackManager, playerCurrentItemDidChange player: AVPlayer)
}

extension Notification.Name {
    /// Notification for when a timebase changed rate
    static let TimebaseEffectiveRateChangedNotification = Notification.Name(rawValue: kCMTimebaseNotification_EffectiveRateChanged as String)
}
