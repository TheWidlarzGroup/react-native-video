import react_native_video
import AVFoundation
import AVKit

@objc(VideoPluginSample)
class VideoPluginSample: NSObject, RNVPlugin {
    private var _playerRateChangeObserver: NSKeyValueObservation?
    private var _playerCurrentItemChangeObserver: NSKeyValueObservation?
    private var _playerItemStatusObserver: NSKeyValueObservation?

    /**
     * create an init function to register the plugin
     */
    override init() {
        super.init()
        ReactNativeVideoManager.shared.registerPlugin(plugin: self)
    }
    
    
    @objc(withResolver:withRejecter:)
    func setMetadata(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(true)
    }
        
    /*
     * Handlers called on player creation and destructon
     */
    func onInstanceCreated(id: String, player: Any) {
        if player is AVPlayer {
            let avPlayer = player as! AVPlayer
            NSLog("plug onInstanceCreated")
            _playerRateChangeObserver = avPlayer.observe(\.rate, options: [.old], changeHandler: handlePlaybackRateChange)
            _playerCurrentItemChangeObserver = avPlayer.observe(\.currentItem, options: [.old], changeHandler: handleCurrentItemChange)

        }
    }

    func onInstanceRemoved(id: String, player: Any) {
        if player is AVPlayer {
            let avPlayer = player as! AVPlayer
            NSLog("plug onInstanceRemoved")
            _playerRateChangeObserver?.invalidate()
            _playerCurrentItemChangeObserver?.invalidate()
        }
    }
    
    /**
     * custom functions to be able to track AVPlayer state change
     */
    func handlePlaybackRateChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>) {
        NSLog("plugin: handlePlaybackRateChange \(change.oldValue)")
    }

    func handlePlayerItemStatusChange(playerItem: AVPlayerItem, change _: NSKeyValueObservedChange<AVPlayerItem.Status>) {
        NSLog("plugin: handlePlayerItemStatusChange \(playerItem.status)")
    }

    func handleCurrentItemChange(player: AVPlayer, change: NSKeyValueObservedChange<AVPlayerItem?>) {
        NSLog("plugin: handleCurrentItemChange \(player.currentItem)")
        guard let playerItem = player.currentItem else {
            _playerItemStatusObserver?.invalidate()
            return
        }
    
        _playerItemStatusObserver = playerItem.observe(\.status, options: [.new, .old], changeHandler: handlePlayerItemStatusChange)
    }
}
