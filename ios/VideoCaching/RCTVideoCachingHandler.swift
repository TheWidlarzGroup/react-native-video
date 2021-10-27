import Foundation
import AVFoundation
import DVAssetLoaderDelegate

class RCTVideoCachingHandler: NSObject, DVAssetLoaderDelegatesDelegate {
    
    private var _videoCache:RCTVideoCache! = RCTVideoCache.sharedInstance()
    private var _playerItemPrepareText: (AVAsset?, NSDictionary?, (AVPlayerItem?)->Void) -> Void
    
    init(_ playerItemPrepareText: @escaping (AVAsset?, NSDictionary?, (AVPlayerItem?)->Void) -> Void) {
        _playerItemPrepareText = playerItemPrepareText
    }
    
    func playerItemForSourceUsingCache(shouldCache:Bool, textTracks:[AnyObject]?, uri:String, assetOptions:NSMutableDictionary, handler:@escaping (AVPlayerItem?)->Void) -> Bool {
        if shouldCache && ((textTracks == nil) || (textTracks!.count == 0)) {
            /* The DVURLAsset created by cache doesn't have a tracksWithMediaType property, so trying
             * to bring in the text track code will crash. I suspect this is because the asset hasn't fully loaded.
             * Until this is fixed, we need to bypass caching when text tracks are specified.
             */
            DebugLog("Caching is not supported for uri '\(uri)' because text tracks are not compatible with the cache. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
            playerItemForSourceUsingCache(uri: uri, assetOptions:assetOptions, withCallback:handler)
            return true
        }
        return false
    }
    
    func playerItemForSourceUsingCache(uri:String!, assetOptions options:NSDictionary!, withCallback handler: @escaping (AVPlayerItem?)->Void) {
        let url = URL(string: uri)
        _videoCache.getItemForUri(uri, withCallback:{ [weak self] (videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?) in
            guard let self = self else { return }
            switch (videoCacheStatus) {
            case .missingFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. It is currently not supported to cache urls that do not include a file extension. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                self._playerItemPrepareText(asset, options, handler)
                return
                
            case .unsupportedFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. The file extension of that uri is currently not supported. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                self._playerItemPrepareText(asset, options, handler)
                return
                
            default:
                if let cachedAsset = cachedAsset {
                    DebugLog("Playing back uri '\(uri)' from cache")
                    // See note in playerItemForSource about not being able to support text tracks & caching
                    handler(AVPlayerItem(asset: cachedAsset))
                    return
                }
            }
            
            let asset:DVURLAsset! = DVURLAsset(url:url, options:options as! [String : Any], networkTimeout:10000)
            asset.loaderDelegate = self
            
            /* More granular code to have control over the DVURLAsset
             let resourceLoaderDelegate = DVAssetLoaderDelegate(url: url)
             resourceLoaderDelegate.delegate = self
             let components = NSURLComponents(url: url, resolvingAgainstBaseURL: false)
             components?.scheme = DVAssetLoaderDelegate.scheme()
             var asset: AVURLAsset? = nil
             if let url = components?.url {
             asset = AVURLAsset(url: url, options: options)
             }
             asset?.resourceLoader.setDelegate(resourceLoaderDelegate, queue: DispatchQueue.main)
             */
            
            handler(AVPlayerItem(asset: asset))
        })
    }
    
    // MARK: - DVAssetLoaderDelegate
    
    func dvAssetLoaderDelegate(loaderDelegate:DVAssetLoaderDelegate!, didLoadData data:NSData!, forURL url:NSURL!) {
        _videoCache.storeItem(data as Data?, forUri:url.absoluteString, withCallback:{ (success:Bool) in
            DebugLog("Cache data stored successfully 🎉")
        })
    }
    
}

