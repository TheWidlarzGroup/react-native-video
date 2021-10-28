import Foundation
import AVFoundation
import DVAssetLoaderDelegate
import Promises

class RCTVideoCachingHandler: NSObject, DVAssetLoaderDelegatesDelegate {
    
    private var _videoCache:RCTVideoCache! = RCTVideoCache.sharedInstance()
    var playerItemPrepareText: ((AVAsset?, NSDictionary?) -> AVPlayerItem)?
    
    override init() {
        super.init()
    }
    
    func shouldCache(source: VideoSource, textTracks:[TextTrack]?) -> Bool {
        if source.isNetwork && source.shouldCache && ((textTracks == nil) || (textTracks!.count == 0)) {
            /* The DVURLAsset created by cache doesn't have a tracksWithMediaType property, so trying
             * to bring in the text track code will crash. I suspect this is because the asset hasn't fully loaded.
             * Until this is fixed, we need to bypass caching when text tracks are specified.
             */
            DebugLog("Caching is not supported for uri '\(source.uri)' because text tracks are not compatible with the cache. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
            return true
        }
        return false
    }
    
    func playerItemForSourceUsingCache(uri:String!, assetOptions options:NSDictionary!) -> Promise<AVPlayerItem?> {
        let url = URL(string: uri)
        return getItemForUri(uri)
        .then{ [weak self] (videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?) -> AVPlayerItem in
            guard let self = self, let playerItemPrepareText = self.playerItemPrepareText else {throw  NSError(domain: "", code: 0, userInfo: nil)}
            switch (videoCacheStatus) {
            case .missingFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. It is currently not supported to cache urls that do not include a file extension. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                return playerItemPrepareText(asset, options)
                
            case .unsupportedFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. The file extension of that uri is currently not supported. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                return playerItemPrepareText(asset, options)
                
            default:
                if let cachedAsset = cachedAsset {
                    DebugLog("Playing back uri '\(uri)' from cache")
                    // See note in playerItemForSource about not being able to support text tracks & caching
                    return AVPlayerItem(asset: cachedAsset)
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
            
            return AVPlayerItem(asset: asset)
        }
    }

    func getItemForUri(_ uri:String) ->  Promise<(videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?)> {
        return Promise<(videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?)> { fulfill, reject in
            self._videoCache.getItemForUri(uri, withCallback:{ (videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?) in
                fulfill((videoCacheStatus, cachedAsset))
            })
        }
    }
    
    // MARK: - DVAssetLoaderDelegate
    
    func dvAssetLoaderDelegate(loaderDelegate:DVAssetLoaderDelegate!, didLoadData data:NSData!, forURL url:NSURL!) {
        _videoCache.storeItem(data as Data?, forUri:url.absoluteString, withCallback:{ (success:Bool) in
            DebugLog("Cache data stored successfully 🎉")
        })
    }
    
}

