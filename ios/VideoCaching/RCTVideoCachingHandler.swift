import AVFoundation
import DVAssetLoaderDelegate
import Foundation

class RCTVideoCachingHandler: NSObject, DVAssetLoaderDelegatesDelegate {
    private var _videoCache: RCTVideoCache! = RCTVideoCache.sharedInstance()
    var playerItemPrepareText: ((AVAsset?, NSDictionary?, String) async -> AVPlayerItem)?

    override init() {
        super.init()
    }

    func shouldCache(source: VideoSource, textTracks: [TextTrack]?) -> Bool {
        if source.isNetwork && source.shouldCache && ((textTracks == nil) || (textTracks!.isEmpty)) {
            /* The DVURLAsset created by cache doesn't have a tracksWithMediaType property, so trying
             * to bring in the text track code will crash. I suspect this is because the asset hasn't fully loaded.
             * Until this is fixed, we need to bypass caching when text tracks are specified.
             */
            DebugLog("""
              Caching is not supported for uri '\(source.uri)' because text tracks are not compatible with the cache.
              Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md
            """)
            return true
        }
        return false
    }

    func playerItemForSourceUsingCache(uri: String!, assetOptions options: NSDictionary!) async throws -> AVPlayerItem {
        let url = URL(string: uri)
        let (videoCacheStatus, cachedAsset) = await getItemForUri(uri)

        guard let playerItemPrepareText else {
            throw NSError(domain: "", code: 0, userInfo: nil)
        }

        switch videoCacheStatus {
        case .missingFileExtension:
            DebugLog("""
              Could not generate cache key for uri '\(uri ?? "NO_URI")'.
              It is currently not supported to cache urls that do not include a file extension.
              The video file will not be cached.
              Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md
            """)
            let asset: AVURLAsset! = AVURLAsset(url: url!, options: options as! [String: Any])
            return await playerItemPrepareText(asset, options, "")

        case .unsupportedFileExtension:
            DebugLog("""
              Could not generate cache key for uri '\(uri ?? "NO_URI")'.
              The file extension of that uri is currently not supported.
              The video file will not be cached.
              Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md
            """)
            let asset: AVURLAsset! = AVURLAsset(url: url!, options: options as! [String: Any])
            return await playerItemPrepareText(asset, options, "")

        default:
            if let cachedAsset {
                DebugLog("Playing back uri '\(uri ?? "NO_URI")' from cache")
                // See note in playerItemForSource about not being able to support text tracks & caching
                return AVPlayerItem(asset: cachedAsset)
            }
        }

        let asset: DVURLAsset! = DVURLAsset(url: url, options: options as! [String: Any], networkTimeout: 10000)
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

    func getItemForUri(_ uri: String) async -> (videoCacheStatus: RCTVideoCacheStatus, cachedAsset: AVAsset?) {
        await withCheckedContinuation { continuation in
            self._videoCache.getItemForUri(uri, withCallback: { (videoCacheStatus: RCTVideoCacheStatus, cachedAsset: AVAsset?) in
                continuation.resume(returning: (videoCacheStatus, cachedAsset))
            })
        }
    }

    // MARK: - DVAssetLoaderDelegate

    func dvAssetLoaderDelegate(_: DVAssetLoaderDelegate!, didLoad data: Data!, for url: URL!) {
        _videoCache.storeItem(data as Data?, forUri: url.absoluteString, withCallback: { (_: Bool) in
            DebugLog("Cache data stored successfully 🎉")
        })
    }
}
