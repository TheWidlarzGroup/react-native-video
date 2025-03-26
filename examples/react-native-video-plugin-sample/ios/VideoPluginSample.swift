import react_native_video
import AVFoundation
import AVKit

@objc(VideoPluginSample)
class VideoPluginSample: RNVAVPlayerPlugin {
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
    
    deinit {
        ReactNativeVideoManager.shared.unregisterPlugin(plugin: self)
    }
    
    
    @objc(withResolver:withRejecter:)
    func setMetadata(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(true)
    }
        
    /*
     * Handlers called on player creation and destructon
     */
    override func onInstanceCreated(id: String, player: AVPlayer) {
        NSLog("plug onInstanceCreated")
        _playerRateChangeObserver = player.observe(\.rate, options: [.old], changeHandler: handlePlaybackRateChange)
        _playerCurrentItemChangeObserver = player.observe(\.currentItem, options: [.old], changeHandler: handleCurrentItemChange)
    }

    override func onInstanceRemoved(id: String, player: AVPlayer) {
        NSLog("plug onInstanceRemoved")
        _playerRateChangeObserver?.invalidate()
        _playerCurrentItemChangeObserver?.invalidate()
    }
    
    /**
     * custom functions to be able to track AVPlayer state change
     */
    func handlePlaybackRateChange(player: AVPlayer, change: NSKeyValueObservedChange<Float>) {
        NSLog("plugin: handlePlaybackRateChange \(String(describing: change.oldValue))")
    }

    func handlePlayerItemStatusChange(playerItem: AVPlayerItem, change _: NSKeyValueObservedChange<AVPlayerItem.Status>) {
        NSLog("plugin: handlePlayerItemStatusChange \(playerItem.status)")
    }

    func handleCurrentItemChange(player: AVPlayer, change: NSKeyValueObservedChange<AVPlayerItem?>) {
        NSLog("plugin: handleCurrentItemChange \(String(describing: player.currentItem))")
        guard let playerItem = player.currentItem else {
            _playerItemStatusObserver?.invalidate()
            return
        }
    
        _playerItemStatusObserver = playerItem.observe(\.status, options: [.new, .old], changeHandler: handlePlayerItemStatusChange)
    }
}
